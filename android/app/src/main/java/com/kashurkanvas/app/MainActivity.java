package com.kashurkanvas.app;

import android.os.Bundle;
import android.webkit.DownloadListener;
import android.webkit.WebView;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KashurMediaExportPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.addJavascriptInterface(new KashurMediaExportPlugin.JsInterface(this), "KashurNativeExport");
                webView.setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                        if (url != null && url.startsWith("data:")) {
                            String fileName = "kashur-download";
                            if (mimeType != null && mimeType.contains("image")) {
                                fileName += (mimeType.contains("jpeg") || mimeType.contains("jpg")) ? ".jpg" : ".png";
                                KashurMediaExportPlugin.saveImageBytes(
                                        MainActivity.this,
                                        KashurMediaExportPlugin.decodeData(url),
                                        fileName,
                                        mimeType,
                                        "KoshurKanvas"
                                );
                                Toast.makeText(MainActivity.this, "Saved to Pictures/KoshurKanvas", Toast.LENGTH_LONG).show();
                            } else {
                                fileName += (mimeType != null && mimeType.contains("pdf")) ? ".pdf" : ".bin";
                                KashurMediaExportPlugin.saveDocumentBytes(
                                        MainActivity.this,
                                        KashurMediaExportPlugin.decodeData(url),
                                        fileName,
                                        mimeType != null ? mimeType : "application/octet-stream",
                                        "KoshurKanvas"
                                );
                                Toast.makeText(MainActivity.this, "Saved to Downloads/KoshurKanvas", Toast.LENGTH_LONG).show();
                            }
                        }
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

