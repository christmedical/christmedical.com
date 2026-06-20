namespace ChristMedical.WebAPI.Models;

/// <summary>
/// A sign-in account as stored in <c>public.users</c>. Reference type so it can be the
/// <c>TUser</c> for <see cref="Microsoft.AspNetCore.Identity.PasswordHasher{TUser}"/>.
/// </summary>
public sealed class AuthUser
{
    public Guid Id { get; init; }
    public short TenantId { get; init; }
    public string Email { get; init; } = "";
    public string DisplayName { get; init; } = "";
    public string PasswordHash { get; init; } = "";
    public string Role { get; init; } = "clinician";
    public bool IsActive { get; init; }
}