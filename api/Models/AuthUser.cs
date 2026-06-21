namespace ChristMedical.WebAPI.Models;

/// <summary>
/// A sign-in account as stored in <c>public.users</c>. Reference type for password hashing.
/// Tenant scope comes from <c>user_tenant_memberships</c>, not a column on users.
/// </summary>
public sealed class AuthUser
{
    public Guid Id { get; init; }
    public string Email { get; init; } = "";
    public string FirstName { get; init; } = "";
    public string LastName { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public string PasswordHash { get; init; } = "";
    public bool IsActive { get; init; }
}
