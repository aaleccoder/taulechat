# Maintainer:
pkgname=taulechat-git
pkgver=0.1.0
pkgrel=1
pkgdesc="A modern AI chat application built with Tauri, React, and Rust"
arch=('x86_64' 'aarch64')
url="https://github.com/aaleccoder/taulechat.git"
license=('MIT')
depends=('cairo' 'desktop-file-utils' 'gdk-pixbuf2' 'glib2' 'gtk3' 'hicolor-icon-theme' 'libsoup3' 'pango' 'webkit2gtk-4.1' 'openssl')
makedepends=('git' 'openssl' 'appmenu-gtk-module' 'libappindicator-gtk3' 'librsvg' 'cargo' 'bun' 'nodejs')
provides=('taulechat')
conflicts=('taulechat')
source=("${pkgname}::git+${url}")
sha256sums=('SKIP')

pkgver() {
  cd "${pkgname}"
  ( set -o pipefail
    git describe --long --abbrev=7 2>/dev/null | sed 's/\([^-]*-g\)/r\1/;s/-/./g' ||
    printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short=7 HEAD)"
  )
}

prepare() {
  cd "${pkgname}"
  export npm_config_cache="${srcdir}/.npm"
  export npm_config_userconfig="${srcdir}/.npmrc"
  bun install --frozen-lockfile
}

build() {
  cd "${pkgname}"
  export npm_config_cache="${srcdir}/.npm"
  export npm_config_userconfig="${srcdir}/.npmrc"

  # Build the frontend
  bun run build

  # Build the Tauri app
  bun run tauri build --bundles deb
}

package() {
  cd "${pkgname}"

  # Extract the deb package contents
  local _debfile="src-tauri/target/release/bundle/deb/taulechat_${pkgver%.r*}_"*.deb
  if [ ! -f $_debfile ]; then
    _debfile="src-tauri/target/release/bundle/deb/taulechat_0.1.0_"*.deb
  fi

  # Create temporary extraction directory
  local _tmpdir="${srcdir}/extract"
  mkdir -p "${_tmpdir}"

  # Extract the deb file
  ar x "${_debfile}" --output "${_tmpdir}"
  tar -xf "${_tmpdir}/data.tar.xz" -C "${_tmpdir}"

  # Copy the extracted files to the package directory
  cp -r "${_tmpdir}/usr" "${pkgdir}/"

  # Clean up
  rm -rf "${_tmpdir}"
}
