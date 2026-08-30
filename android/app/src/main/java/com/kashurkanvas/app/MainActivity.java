package com.kashurkanvas.app;

import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.ActionMode;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.DownloadListener;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KashurMediaExportPlugin.class);
        super.onCreate(savedInstanceState);

        configureSystemUI();

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                final WebView webView = getBridge().getWebView();
                
                // Prevent white flashes during transitions
                webView.setBackgroundColor(ContextCompat.getColor(this, R.color.windowBackground));

                webView.addJavascriptInterface(new KashurMediaExportPlugin.JsInterface(this), "KashurNativeExport");
                webView.setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(final String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                        if (url == null || url.trim().isEmpty()) return;

                        final String targetFileName = KashurMediaExportPlugin.parseFileName(contentDisposition, url, mimeType);
                        final String finalMimeType = (mimeType != null && !mimeType.trim().isEmpty()) ? mimeType : KashurMediaExportPlugin.getMimeTypeFromFileName(targetFileName);

                        if (url.startsWith("data:")) {
                            new Thread(() -> {
                                try {
                                    byte[] bytes = KashurMediaExportPlugin.decodeData(url);
                                    if (bytes == null || bytes.length == 0) return;
                                    boolean isImage = finalMimeType.startsWith("image/");
                                    Uri uri = isImage ?
                                            KashurMediaExportPlugin.saveImageBytes(MainActivity.this, bytes, targetFileName, finalMimeType, "KoshurKanvas") :
                                            KashurMediaExportPlugin.saveDocumentBytes(MainActivity.this, bytes, targetFileName, finalMimeType, "KoshurKanvas");
                                    if (uri == null && isImage && targetFileName.endsWith(".svg")) {
                                        uri = KashurMediaExportPlugin.saveDocumentBytes(MainActivity.this, bytes, targetFileName, finalMimeType, "KoshurKanvas");
                                    }
                                    if (uri != null) {
                                        final String loc = isImage ? "Pictures/KoshurKanvas" : "Downloads/KoshurKanvas";
                                        runOnUiThread(() -> Toast.makeText(MainActivity.this, "Saved to " + loc, Toast.LENGTH_LONG).show());
                                    }
                                } catch (Exception e) {
                                    Log.e(TAG, "Data URL download failed", e);
                                }
                            }).start();
                        } else if (url.startsWith("blob:")) {
                            runOnUiThread(() -> {
                                String safeFileName = targetFileName.replace("'", "\\'");
                                String safeMime = finalMimeType.replace("'", "\\'");
                                String script = "(async function() {" +
                                        "  try {" +
                                        "    const res = await fetch('" + url + "');" +
                                        "    const blob = await res.blob();" +
                                        "    const reader = new FileReader();" +
                                        "    reader.onloadend = function() {" +
                                        "      if (window.KashurNativeExport && window.KashurNativeExport.handleBlobDownload) {" +
                                        "        window.KashurNativeExport.handleBlobDownload(reader.result, '" + safeFileName + "', '" + safeMime + "');" +
                                        "      }" +
                                        "    };" +
                                        "    reader.readAsDataURL(blob);" +
                                        "  } catch(e) {" +
                                        "    console.error('Blob download fetch error:', e);" +
                                        "  }" +
                                        "})();";
                                webView.evaluateJavascript(script, null);
                            });
                        } else if (url.startsWith("http://") || url.startsWith("https://")) {
                            new Thread(() -> {
                                try {
                                    URL downloadUrl = new URL(url);
                                    HttpURLConnection conn = (HttpURLConnection) downloadUrl.openConnection();
                                    conn.setConnectTimeout(10000);
                                    conn.setReadTimeout(10000);
                                    conn.connect();
                                    if (conn.getResponseCode() == 200) {
                                        InputStream input = conn.getInputStream();
                                        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                                        byte[] data = new byte[8192];
                                        int nRead;
                                        while ((nRead = input.read(data, 0, data.length)) != -1) {
                                            buffer.write(data, 0, nRead);
                                        }
                                        buffer.flush();
                                        byte[] bytes = buffer.toByteArray();
                                        if (bytes.length > 0) {
                                            boolean isImage = finalMimeType.startsWith("image/");
                                            Uri uri = isImage ?
                                                    KashurMediaExportPlugin.saveImageBytes(MainActivity.this, bytes, targetFileName, finalMimeType, "KoshurKanvas") :
                                                    KashurMediaExportPlugin.saveDocumentBytes(MainActivity.this, bytes, targetFileName, finalMimeType, "KoshurKanvas");
                                            if (uri == null && isImage && targetFileName.endsWith(".svg")) {
                                                uri = KashurMediaExportPlugin.saveDocumentBytes(MainActivity.this, bytes, targetFileName, finalMimeType, "KoshurKanvas");
                                            }
                                            if (uri != null) {
                                                final String loc = isImage ? "Pictures/KoshurKanvas" : "Downloads/KoshurKanvas";
                                                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Saved to " + loc, Toast.LENGTH_LONG).show());
                                            }
                                        }
                                    }
                                } catch (Exception e) {
                                    Log.e(TAG, "HTTP download error", e);
                                }
                            }).start();
                        }
                    }
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting up WebView download listener", e);
        }
    }

    private void configureSystemUI() {
        try {
            Window window = getWindow();

            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);

            int statusBarColor = ContextCompat.getColor(this, R.color.statusBarColor);
            int navBarColor = ContextCompat.getColor(this, R.color.navigationBarColor);

            window.setStatusBarColor(statusBarColor);
            window.setNavigationBarColor(navBarColor);

            // Configure light/dark icon contrast for status bar and navigation bar
            WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
            if (insetsController != null) {
                // false = light (white) status bar icons on dark green background
                insetsController.setAppearanceLightStatusBars(false);
                // false = light (white) navigation bar icons on dark green background
                insetsController.setAppearanceLightNavigationBars(false);
            }

            // Handle display cutouts (camera notches / punch holes) gracefully
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams layoutParams = window.getAttributes();
                layoutParams.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                window.setAttributes(layoutParams);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring System UI", e);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        configureSystemUI();
    }

    @Override
    public void onActionModeStarted(ActionMode mode) {
        super.onActionModeStarted(mode);
        try {
            View customView = mode.getCustomView();
            if (customView != null) {
                customView.setBackgroundColor(ContextCompat.getColor(this, R.color.actionModeBackground));
            }
        } catch (Exception ignored) {}
    }
}

