namespace Mist.Domain.Enums;

public enum OrderStatus { Received, Preparing, Ready, Served, Paid, Cancelled }

public enum WaiterCallReason { Water, Napkins, Assistance, Order }

public enum ServiceCallStatus { Open, Acknowledged, Resolved }

public enum PaymentMethod { Cash, Card, Split }

public enum ModifierSelection { Single, Multiple }

public enum TableZone { Indoor, Terrace, Garden }

public enum StaffRole { Staff, Admin }
