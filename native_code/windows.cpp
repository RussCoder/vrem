#pragma comment(lib, "Version.lib")

#define NODE_ADDON_API_DISABLE_DEPRECATED 1
#include <napi.h>

//#include <iostream>
#include <string>
#include <windows.h>
#include <winver.h>

using namespace std;

wstring getFileDescription(const wchar_t* filename) {
    wstring result;

    int versionInfoSize = GetFileVersionInfoSizeW(filename, NULL);
    if (!versionInfoSize) {
        return result;
    }

    auto versionInfo = new BYTE[versionInfoSize];
    std::unique_ptr<BYTE[]> versionInfo_automatic_cleanup(versionInfo);
    if (!GetFileVersionInfoW(filename, NULL, versionInfoSize, versionInfo)) {
        return result;
    }

    struct LANGANDCODEPAGE {
        WORD wLanguage;
        WORD wCodePage;
    } * translationArray;

    UINT translationArrayByteLength = 0;
    if (!VerQueryValueW(versionInfo, L"\\VarFileInfo\\Translation", (LPVOID*)&translationArray,
                        &translationArrayByteLength)) {
        return result;
    }

    unsigned int systemLangIndex = 0;
    for (unsigned int i = 0; i < (translationArrayByteLength / sizeof(LANGANDCODEPAGE)); i++) {
        if (GetSystemDefaultUILanguage() == translationArray[i].wLanguage) {
            systemLangIndex = i;
        }
    }

    wchar_t fileDescriptionKey[256];
    wsprintfW(fileDescriptionKey, L"\\StringFileInfo\\%04x%04x\\FileDescription",
              translationArray[systemLangIndex].wLanguage, translationArray[systemLangIndex].wCodePage);

    wchar_t* fileDescription = nullptr;
    UINT fileDescriptionSize;
    if (VerQueryValueW(versionInfo, fileDescriptionKey, (LPVOID*)&fileDescription, &fileDescriptionSize)) {
        result = fileDescription;
    }

    return result;
}

Napi::Value createErrorObject(const Napi::Env& env, const string& message) {
    auto error = Napi::Object::New(env);
    error.Set("code", GetLastError());
    error.Set("message", message);

    auto result = Napi::Object::New(env);
    result.Set("error", error);
    return result;
}

inline Napi::String toJsString(const Napi::Env& env, const wchar_t* string) {
    // alternatives are WideCharToMultiByte() or
    // string narrow = wstring_convert<codecvt_utf8<wchar_t>>().to_bytes(L"some string");
    return Napi::String::New(env, reinterpret_cast<const char16_t*>(string));
}

Napi::Value getActiveProgram(const Napi::CallbackInfo& info) {
    // Set locale of the console to print non-ASCII symbols
    // SetConsoleOutputCP(GetACP());
    // SetConsoleCP(GetACP());
    // wcout.imbue(std::locale("")); // set default global locale
    // ----------------------------------------------------

    // auto path = L"C:\\Windows\\explorer.exe";
    // getFileDescription(path);

    Napi::Env env = info.Env();
    wchar_t exePath[512];
    HWND windowHandle = GetForegroundWindow(); // from docs: "can be NULL ... if a window is losing activation"
    if (!windowHandle) {
        return env.Null();
    }

    DWORD processId;
    GetWindowThreadProcessId(windowHandle, &processId);
    // wcout << "Process id" << processId << endl;

    auto processHandle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, processId);
    if (!processHandle) {
        return createErrorObject(env, "Cannot open process");
    }

    DWORD length = sizeof(exePath) / sizeof(exePath[0]);
    auto success = QueryFullProcessImageNameW(processHandle, 0, exePath, &length);

    if (success) {
        auto fileDescription = getFileDescription(exePath);
        auto obj = Napi::Object::New(env);
        obj.Set("path", toJsString(env, exePath));
        obj.Set("description", toJsString(env, fileDescription.c_str()));
        return obj;
    } else {
        // wcout << endl << L"An error occurred. Code: " << GetLastError() << endl;
        return createErrorObject(env, "Cannot get path to the executable file");
    }
}

Napi::Value getIdleTime(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    LASTINPUTINFO lastInput = {sizeof(LASTINPUTINFO), 0};
    BOOL success = GetLastInputInfo(&lastInput);
    if (success) {
        return Napi::Number::New(env, GetTickCount() - lastInput.dwTime);
    } else {
        return env.Null();
    }
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getActiveProgram", Napi::Function::New(env, getActiveProgram));
    exports.Set("getIdleTime", Napi::Function::New(env, getIdleTime));
    return exports;
}

NODE_API_MODULE(vrem_windows, Init)