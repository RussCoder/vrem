{
  "targets": [ {
    "target_name": "vrem_windows",
    "cflags!": [ "-fno-exceptions" ],
    "cflags_cc!": [ "-fno-exceptions" ],
    "sources": [ "./native_code/windows.cpp" ],
    "include_dirs": [ "<!@(node -p \"require('node-addon-api').include\")" ],
    'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
  }, {
    "target_name": "copy_binary",
    "type": "none",
    "dependencies": [ "vrem_windows" ],
    "copies":
      [
        {
          'destination': '<(module_root_dir)/dist_native',
          'files': [ '<(module_root_dir)/build/Release/vrem_windows.node' ]
        }
      ]
  } ]
}