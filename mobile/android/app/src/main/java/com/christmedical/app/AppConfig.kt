package com.christmedical.app

/**
 * Configuration for the Christ Medical native shell.
 */
object AppConfig {
    /** Production login portal loaded by the WebView. */
    const val PORTAL_URL = "https://login.christmedical.com/"

    /**
     * Returns true when [url] is within a Christ Medical host (including subpaths).
     */
    fun isAllowedNavigation(url: String): Boolean {
        val host = runCatching { java.net.URI(url).host?.lowercase() }.getOrNull()
            ?: return false
        return host == "login.christmedical.com" || host.endsWith(".christmedical.com")
    }
}
