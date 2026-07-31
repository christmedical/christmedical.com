import Foundation

/// Configuration for the Christ Medical native shell.
public enum AppConfig {
    /// Production login portal loaded by the WebView.
    public static let portalURLString = "https://login.christmedical.com/"

    /// Parsed portal URL, or `nil` if the constant is malformed.
    public static var portalURL: URL? {
        URL(string: portalURLString)
    }

    /// Returns `true` when `url` is within the Christ Medical login host (including subpaths).
    public static func isAllowedNavigation(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        return host == "login.christmedical.com" || host.hasSuffix(".christmedical.com")
    }
}
