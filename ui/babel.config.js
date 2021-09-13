module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    [
      'import',
      {
        libraryName: 'element-plus',
        // import component
        customName: (name) => {
          name = name.slice(3)
          return `element-plus/lib/components/${name}`
        },
        // import style
        customStyleName: (name) => {
          name = name.slice(3)
          // if you need [name].scss source file, you need to uncomment this line
          // return `element-plus/lib/components/${name}/style`
          // import [name].css
          return `element-plus/lib/components/${name}/style/css`
        },
      },
    ],
  ],
}