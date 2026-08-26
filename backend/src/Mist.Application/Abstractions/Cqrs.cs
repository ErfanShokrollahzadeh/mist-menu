using System.Reflection;
using System.Runtime.ExceptionServices;
using Microsoft.Extensions.DependencyInjection;

namespace Mist.Application.Abstractions;

/// <summary>
/// A minimal CQRS dispatcher.
///
/// MediatR would be the obvious choice, but from v13 it ships under RPL-1.5
/// or a paid commercial licence, and RPL-1.5 obliges you to publish the source
/// of anything built with it. That is not a reasonable condition to attach to
/// a cafe's point-of-sale, and this is the whole of what the project used it
/// for.
/// </summary>
public interface IRequest<TResponse>;

public interface IRequestHandler<in TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken ct);
}

public interface IDispatcher
{
    Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken ct = default);
}

public sealed class Dispatcher(IServiceProvider provider) : IDispatcher
{
    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var handlerType = typeof(IRequestHandler<,>).MakeGenericType(request.GetType(), typeof(TResponse));
        var handler = provider.GetService(handlerType)
            ?? throw new InvalidOperationException(
                $"No handler registered for {request.GetType().Name}.");

        var method = handlerType
            .GetMethod(nameof(IRequestHandler<IRequest<TResponse>, TResponse>.Handle))!;

        try
        {
            // Resolved by reflection; the generic constraint is enforced at
            // registration, so this cast is safe.
            return (Task<TResponse>)method.Invoke(handler, [request, ct])!;
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            // A handler whose Handle is not `async` throws synchronously, and
            // Invoke wraps that in TargetInvocationException. Left wrapped, a
            // validation failure reaches the API as an unrecognised exception
            // and is reported as a 500 rather than a 400.
            ExceptionDispatchInfo.Capture(ex.InnerException).Throw();
            throw;   // unreachable; keeps the compiler happy
        }
    }
}

public static class CqrsRegistration
{
    /// <summary>Registers every IRequestHandler in the assembly containing <typeparamref name="TMarker"/>.</summary>
    public static IServiceCollection AddCqrs<TMarker>(this IServiceCollection services)
    {
        services.AddScoped<IDispatcher, Dispatcher>();

        var handlers = typeof(TMarker).Assembly.GetTypes()
            .Where(t => t is { IsAbstract: false, IsInterface: false })
            .SelectMany(t => t.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>))
                .Select(i => (Service: i, Implementation: t)));

        foreach (var (service, implementation) in handlers)
            services.AddScoped(service, implementation);

        return services;
    }
}
