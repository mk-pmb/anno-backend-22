#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function dinst_main () {
  local SELFFILE="$(readlink -m -- "$BASH_SOURCE")"
  local SELFPATH="$(dirname -- "$SELFFILE")"
  source -- "$SELFPATH"/lib/kisi.sh --lib || return $?

  local REPOPATH="$(dirname -- "$SELFPATH")"
  case "$REPOPATH" in
    *[': ']* )
      echo "E: Path contains unsupported characters: $REPOPATH" >&2
      return 8;;
  esac

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

  DK_CMD+=(
    --volume "$REPOPATH:/app:rw"
    "${DK_VARS[@]}"
    --workdir /app
    node:20
    "$DKSELF"
    inside_docker_"$DK_TASK"
    )
  "${DK_CMD[@]}" || return $?
  echo 'Gonna fix permissions (usually, no files should be affected):'
  sudo chown --reference . --changes -- node_modules/ || return $?
  echo 'Cleaning up some potential traps:'
  rm -- package-lock.json 2>/dev/null

  echo; chapterize 'All done.'
}


function dinst_inside_docker_install () {
  chapterize dinst_configure_npm || return $?

  cd -- "$REPOPATH/$APP_SUBPATH" || return $?
  chapterize --cwd '' npm install . || return $?

  chapterize --cwd 'Generate database initialization file' \
    dinst_dbinit_gen || return $?
}


function dinst_inside_docker_eval () {
  cd -- "$REPOPATH/$APP_SUBPATH" || return $?
  eval "$DK_EVAL" || return $?
}


function dinst_inside_docker_run_script () {
  cd -- "$REPOPATH/$APP_SUBPATH" || return $?
  ./node_modules/.bin/nodemjs $DK_EVAL || return $?
}


function dinst_configure_npm () {
  sed -nre '/\S/s~^\s+~~p' <<<'
    send-metrics    = false
    package-lock    = false
    update-notifier = false
    ' >"$HOME"/.npmrc || return $?
}


function dinst_dbinit_gen () {
  cd -- "$REPOPATH" || return $?
  local DEST='util/pg/dbinit_structure.sql'
  nodemjs "${DEST%.*}".gen.mjs >"$DEST" || return $?
  # wc --lines -- "$DEST" || return $?
  grep --with-filename -Fe '$date$' -- "$DEST" || return $?
}








dinst_main "$@"; exit $?
