import SwiftUI
import ChristMedicalKit

struct ContentView: View {
    var body: some View {
        Group {
            if let url = AppConfig.portalURL {
                WebView(url: url)
                    .ignoresSafeArea(edges: .bottom)
            } else {
                ContentUnavailableView(
                    "Unable to load portal",
                    systemImage: "exclamationmark.triangle",
                    description: Text("The portal URL is invalid.")
                )
            }
        }
    }
}

#Preview {
    ContentView()
}
