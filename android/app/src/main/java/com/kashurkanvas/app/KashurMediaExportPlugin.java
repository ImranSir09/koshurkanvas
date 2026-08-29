package com.kashurkanvas.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "KashurMediaExport")
public class KashurMediaExportPlugin extends Plugin {
    private static final String TAG = "KashurMediaExport";
    private static final String ALBUM_NAME = "KoshurKanvas";

    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "kashur-design.png");
        String mimeType = call.getString("mimeType", "image/png");
        String album = call.getString("album", ALBUM_NAME);

        if (data == null || data.isEmpty()) {
            call.reject("Data is required");
            return;
        }

        try {
            byte[] bytes = decodeData(data);
            Uri savedUri = saveImageBytes(getContext(), bytes, fileName, mimeType, album);

            if (savedUri != null) {
                showToast("Image saved to Pictures/" + album);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", savedUri.toString());
                ret.put("fileName", fileName);
                ret.put("path", "Pictures/" + album + "/" + fileName);
                call.resolve(ret);
            } else {
                call.reject("Failed to save image to MediaStore");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error saving image", e);
            call.reject("Error saving image: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void saveDocumentToStorage(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "kashur-document.pdf");
        String mimeType = call.getString("mimeType", "application/pdf");
        String folder = call.getString("folder", ALBUM_NAME);

        if (data == null || data.isEmpty()) {
            call.reject("Data is required");
            return;
        }

        try {
            byte[] bytes = decodeData(data);
            Uri savedUri = saveDocumentBytes(getContext(), bytes, fileName, mimeType, folder);

            if (savedUri != null) {
                showToast("Document saved to Downloads/" + folder);
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("uri", savedUri.toString());
                ret.put("fileName", fileName);
                ret.put("path", "Downloads/" + folder + "/" + fileName);
                call.resolve(ret);
            } else {
                call.reject("Failed to save document to MediaStore");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error saving document", e);
            call.reject("Error saving document: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void shareFile(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "kashur-export.png");
        String mimeType = call.getString("mimeType", "image/png");
        String title = call.getString("title", "Kashur Kanvas");
        String text = call.getString("text", "Created with Kashur Kanvas");

        if (data == null || data.isEmpty()) {
            call.reject("Data is required");
            return;
        }

        try {
            byte[] bytes = decodeData(data);
            Context context = getContext();
            File cacheDir = new File(context.getCacheDir(), "shared_exports");
            if (!cacheDir.exists()) {
                cacheDir.mkdirs();
            }

            File tempFile = new File(cacheDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(bytes);
                fos.flush();
            }

            Uri contentUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    tempFile
            );

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType(mimeType);
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            if (title != null && !title.isEmpty()) {
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            }
            if (text != null && !text.isEmpty()) {
                shareIntent.putExtra(Intent.EXTRA_TEXT, text);
            }
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(shareIntent, title);
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(chooser);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error sharing file", e);
            call.reject("Error sharing file: " + e.getMessage(), e);
        }
    }

    // Static helper methods for direct Java / Bridge usage
    public static byte[] decodeData(String data) {
        if (data.startsWith("data:")) {
            int commaIndex = data.indexOf(",");
            if (commaIndex != -1) {
                String meta = data.substring(0, commaIndex);
                String raw = data.substring(commaIndex + 1);
                if (meta.contains(";base64")) {
                    return Base64.decode(raw, Base64.DEFAULT);
                } else {
                    return Uri.decode(raw).getBytes(StandardCharsets.UTF_8);
                }
            }
        }
        try {
            return Base64.decode(data, Base64.DEFAULT);
        } catch (Exception e) {
            return data.getBytes(StandardCharsets.UTF_8);
        }
    }

    public static Uri saveImageBytes(Context context, byte[] bytes, String fileName, String mimeType, String album) {
        ContentResolver resolver = context.getContentResolver();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
            values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + File.separator + album);
            values.put(MediaStore.Images.Media.IS_PENDING, 1);

            Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (uri != null) {
                try (OutputStream os = resolver.openOutputStream(uri)) {
                    if (os != null) {
                        os.write(bytes);
                        os.flush();
                    }
                    values.clear();
                    values.put(MediaStore.Images.Media.IS_PENDING, 0);
                    resolver.update(uri, values, null, null);
                    return uri;
                } catch (Exception e) {
                    Log.e(TAG, "Failed writing to MediaStore", e);
                    resolver.delete(uri, null, null);
                }
            }
        } else {
            File picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
            File albumDir = new File(picturesDir, album);
            if (!albumDir.exists()) {
                albumDir.mkdirs();
            }
            File outFile = new File(albumDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                fos.write(bytes);
                fos.flush();
                MediaScannerConnection.scanFile(
                        context,
                        new String[]{outFile.getAbsolutePath()},
                        new String[]{mimeType},
                        null
                );
                return Uri.fromFile(outFile);
            } catch (Exception e) {
                Log.e(TAG, "Failed writing to public directory", e);
            }
        }
        return null;
    }

    public static Uri saveDocumentBytes(Context context, byte[] bytes, String fileName, String mimeType, String folder) {
        ContentResolver resolver = context.getContentResolver();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + File.separator + folder);
            values.put(MediaStore.Downloads.IS_PENDING, 1);

            Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri != null) {
                try (OutputStream os = resolver.openOutputStream(uri)) {
                    if (os != null) {
                        os.write(bytes);
                        os.flush();
                    }
                    values.clear();
                    values.put(MediaStore.Downloads.IS_PENDING, 0);
                    resolver.update(uri, values, null, null);
                    return uri;
                } catch (Exception e) {
                    Log.e(TAG, "Failed writing document to MediaStore", e);
                    resolver.delete(uri, null, null);
                }
            }
        } else {
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File folderDir = new File(downloadsDir, folder);
            if (!folderDir.exists()) {
                folderDir.mkdirs();
            }
            File outFile = new File(folderDir, fileName);
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                fos.write(bytes);
                fos.flush();
                MediaScannerConnection.scanFile(
                        context,
                        new String[]{outFile.getAbsolutePath()},
                        new String[]{mimeType},
                        null
                );
                return Uri.fromFile(outFile);
            } catch (Exception e) {
                Log.e(TAG, "Failed writing document to public directory", e);
            }
        }
        return null;
    }

    private void showToast(final String message) {
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                Toast.makeText(getContext(), message, Toast.LENGTH_LONG).show();
            } catch (Exception ignored) {}
        });
    }

    /**
     * Web JavaScript interface exposed to WebView as `window.KashurNativeExport`
     */
    public static class JsInterface {
        private final Context context;

        public JsInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String saveImage(String data, String fileName, String mimeType) {
            try {
                byte[] bytes = decodeData(data);
                Uri uri = saveImageBytes(context, bytes, fileName, mimeType, ALBUM_NAME);
                if (uri != null) {
                    new Handler(Looper.getMainLooper()).post(() ->
                            Toast.makeText(context, "Image saved to Pictures/KoshurKanvas", Toast.LENGTH_LONG).show()
                    );
                    return uri.toString();
                }
            } catch (Exception e) {
                Log.e(TAG, "JsInterface saveImage failed", e);
            }
            return "";
        }

        @JavascriptInterface
        public String saveDocument(String data, String fileName, String mimeType) {
            try {
                byte[] bytes = decodeData(data);
                Uri uri = saveDocumentBytes(context, bytes, fileName, mimeType, ALBUM_NAME);
                if (uri != null) {
                    new Handler(Looper.getMainLooper()).post(() ->
                            Toast.makeText(context, "Document saved to Downloads/KoshurKanvas", Toast.LENGTH_LONG).show()
                    );
                    return uri.toString();
                }
            } catch (Exception e) {
                Log.e(TAG, "JsInterface saveDocument failed", e);
            }
            return "";
        }

        @JavascriptInterface
        public boolean isNative() {
            return true;
        }
    }
}
