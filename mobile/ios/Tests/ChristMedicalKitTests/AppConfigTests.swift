import XCTest
@testable import ChristMedicalKit

final class AppConfigTests: XCTestCase {
    func testPortalURLStringIsProductionLogin() {
        XCTAssertEqual(AppConfig.portalURLString, "https://login.christmedical.com/")
    }

    func testPortalURLParses() {
        let url = AppConfig.portalURL
        XCTAssertNotNil(url)
        XCTAssertEqual(url?.scheme, "https")
        XCTAssertEqual(url?.host, "login.christmedical.com")
    }

    func testAllowsLoginHostNavigation() throws {
        let url = try XCTUnwrap(URL(string: "https://login.christmedical.com/auth"))
        XCTAssertTrue(AppConfig.isAllowedNavigation(url))
    }

    func testAllowsChristMedicalSubdomain() throws {
        let url = try XCTUnwrap(URL(string: "https://app.christmedical.com/queue"))
        XCTAssertTrue(AppConfig.isAllowedNavigation(url))
    }

    func testRejectsExternalHost() throws {
        let url = try XCTUnwrap(URL(string: "https://evil.example.com/"))
        XCTAssertFalse(AppConfig.isAllowedNavigation(url))
    }

    func testRejectsURLWithoutHost() throws {
        let url = try XCTUnwrap(URL(string: "mailto:support@christmedical.com"))
        XCTAssertFalse(AppConfig.isAllowedNavigation(url))
    }
}
