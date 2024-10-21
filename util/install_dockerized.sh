#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function dinst_main () {
  local SELFFILE="$(readlink -m -- "$BASH_SOURCE")"
  local SELFPATH="$(dirname -- "$SELFFILE")"
  source -- "$SELFPATH"/lib/kisi.sh --lib || return $?

  local REPOPATH="$(dirname -- "$SELFPATH")"
  dinst_validate_docker_volume_path 'repo path' "$REPOPATH" || return $?

  local NPM_AUDIT_LOG="$REPOPATH"/npm-audit.log

  local TASK="${1:-dockerize}"; shift
  "${FUNCNAME%_*}_$TASK" "$@" || return $?$(
    echo "E: Task '$TASK' failed with error code $?" >&2)
}


function dinst_dockerize () {
  cd -- "$REPOPATH" || return $?
  local DKSELF="/app${SELFFILE:${#REPOPATH}}"

  [ -n "$DK_TASK" ] || local DK_TASK='install'

  local DK_VARS=()
  readarray -t DK_VARS < <( env | cut -d = -sf 1 | sed -nrf <(echo '
    s~^DK_ENV_~\n~
    s~^(APP|DK)_~\n&~
    s!^\n!--env&!p
    ') )

  local DK_CMD=(
    docker
    run
    --interactive     # Some tasks need stdio even in batch mode.
    --rm              # Remove temporary container after use
    )

  if tty --silent; then
    echo "Gonna $DK_TASK with dockerized node.js/npm:"
    echo
    DK_CMD+=( --tty )
  fi

  if [ -n "$EXTRAS_DIR" ]; then
    dinst_validate_docker_volume_path EXTRAS_DIR "$EXTRAS_DIR" || return $?
    DK_CMD+=( --volume "$EXTRAS_DIR:/extras:rw" )
  fi

  DK_CMD+=(
    --volume "$REPOPATH:/app:rw"
    "${DK_VARS[@]}"
    --workdir /app
    node:20
    "$DKSELF"
    inside_docker_"$DK_TASK"
    )
  "${DK_CMD[@]}" || return $?
  echo 'Gonna fix permissions:'
  dinst_fix_npm_file_perms . || return $?
  dinst_fix_npm_file_perms /extras || return $?

  echo; chapterize 'All done.'
  case "$DK_TASK" in
    install )
      grep -HnPie '\b(?!0 )\d+ vulnerabilit' -- "$NPM_AUDIT_LOG" || true
      ;;
  esac
}


function dinst_fix_npm_file_perms () {
  [ -d "$1" ] || return 0
  sudo chown --reference "$1" --recursive -- "$1"/node_modules || return $?
}


function dinst_validate_docker_volume_path () {
  local DESCR="$1" VPATH="$2"
  case "$VPATH" in
    *:* | *' '* )
      echo E: "$DESCR contains unsupported characters: $VPATH" >&2
      return 8;;
  esac
  [ -d "$VPATH" ] || return 4$(
    echo E: "$DESCR seems to not be a directory: $VPATH" >&2)
}


function dinst_inside_docker_install () {
  local RUNMJS="$REPOPATH/node_modules/.bin/nodemjs"
  >"$NPM_AUDIT_LOG" || return $?$(
    echo "E: Failed to clear the npm audit log: $NPM_AUDIT_LOG" >&2)

  chapterize dinst_configure_npm || return $?
  dinst_maybe_install_extras || return $?

  cd -- "$REPOPATH/$APP_SUBPATH" || return $?
  chapterize --cwd '' dinst_install_npm_module || return $?
  chapterize --cwd 'Generate database initialization file' \
    dinst_dbinit_gen || return $?
}


function dinst_inside_docker_eval () {
  cd -- "$REPOPATH/$APP_SUBPATH" || return $?
  eval "$DK_EVAL" || return $?
}


function dinst_inside_docker_run_script () {
  cd -- "$REPOPATH/$APP_SUBPATH" || return $?
  $RUNMJS $DK_EVAL || return $?
}


function dinst_configure_npm () {
  sed -nre '/\S/s~^\s+~~p' <<<'
    send-metrics    = false
    package-lock    = false
    update-notifier = false
    ' >"$HOME"/.npmrc || return $?
}


function dinst_maybe_install_extras () {
  if [ ! -d /extras ]; then
    echo D: 'No extras directory is mounted. Skip.'
    return 0
  fi

  local PKGDIR= DESCR=
  for PKGDIR in /extras/*/package.json; do
    [ -f "$PKGDIR" ] || continue
    PKGDIR="${PKGDIR%/*}"
    DESCR="$(basename -- "$PKGDIR")"
    cd -- "$PKGDIR" || return $?$(echo E: "Failed to chdir to $PKGDIR!" >&2)
    chapterize --cwd '' dinst_install_npm_module || return $?
  done
  cd -- "$REPOPATH" || return $?
}


function dinst_install_npm_module () {
  # We temporarily activate the package lock in order to be able to audit:
  local ENABLE_PKGLOCK='--package-lock=true'

  npm install $ENABLE_PKGLOCK . || return $?$(
    echo E: "Failed to install npm package in $PWD" >&2)
  ( printf -- '\n\n===== %(%F %T %Z)T npm audit @ %s =====\n' -1 "$PWD"
    sha1sum --binary -- package-lock.json
    npm audit fix $ENABLE_PKGLOCK --dry-run || true
  ) &>>"$NPM_AUDIT_LOG" || return $?$(
    echo E: "Failed to audit npm package in $PWD" >&2)
  rm -- package-lock.json 2>/dev/null || true
}


function dinst_dbinit_gen () {
  cd -- "$REPOPATH" || return $?
  local DEST='util/pg/dbinit_structure.sql'
  $RUNMJS "${DEST%.*}".gen.mjs >"$DEST" || return $?
  # wc --lines -- "$DEST" || return $?
  grep --with-filename -Fe '$date$' -- "$DEST" || return $?
}








dinst_main "$@"; exit $?
