using Mist.Application.Abstractions;
using Mist.Application.Contracts;

namespace Mist.Application.Feedback;

public sealed record SubmitFeedbackCommand(FeedbackInput Input) : IRequest<FeedbackDto>;

public sealed class SubmitFeedbackHandler(IFeedbackRepository repo)
    : IRequestHandler<SubmitFeedbackCommand, FeedbackDto>
{
    public Task<FeedbackDto> Handle(SubmitFeedbackCommand request, CancellationToken ct)
    {
        if (request.Input.Rating is < 1 or > 5)
            throw new ArgumentOutOfRangeException(nameof(request), "Rating must be between 1 and 5.");
        return repo.CreateAsync(request.Input, ct);
    }
}

public interface IFeedbackRepository
{
    Task<FeedbackDto> CreateAsync(FeedbackInput input, CancellationToken ct);
}
