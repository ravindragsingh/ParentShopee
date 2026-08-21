package com.rewardurkids.app;

import android.os.Bundle;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Let the WebView draw edge-to-edge (under the status bar / gesture nav)
        // on every Android version, not just the 15+ devices where the OS now
        // forces this -- so the app's branded gradient background extends under
        // the system bars consistently, matching what the iOS build already does.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Android's WebView, unlike iOS Safari, never populates CSS
        // env(safe-area-inset-*) with the real status bar / nav bar height --
        // it stays 0 even while edge-to-edge, which is what left the navbar
        // drawn underneath the status bar. Measure the real inset natively and
        // hand it to the web content as CSS custom properties instead; styles.css
        // combines these with env() into --sa-inset-* for both platforms.
        ViewCompat.setOnApplyWindowInsetsListener(bridge.getWebView(), (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            float density = getResources().getDisplayMetrics().density;
            String js = String.format(
                Locale.US,
                "document.documentElement.style.setProperty('--android-inset-top','%fpx');" +
                "document.documentElement.style.setProperty('--android-inset-bottom','%fpx');" +
                "document.documentElement.style.setProperty('--android-inset-left','%fpx');" +
                "document.documentElement.style.setProperty('--android-inset-right','%fpx');",
                bars.top / density,
                bars.bottom / density,
                bars.left / density,
                bars.right / density
            );
            bridge.getWebView().evaluateJavascript(js, null);
            return windowInsets;
        });
    }
}
