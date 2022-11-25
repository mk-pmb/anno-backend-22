#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function dinst () {
  local REPOPATH="$(readlink -m -- "$BASH_SOURCE"/../..)"
  case "$REPOPATH" in
    *[': ']* )
      echo "E: Path contains unsupported characters: $REPOPATH" >&2
      return 8;;
  esac

  echo 'Gonna install with dockerized npm:'
  echo
  local DK_CMD=(
    docker
    run
    --tty
    --interactive
    --volume "$REPOPATH:/app:rw"
    --workdir /app
    node:16
    npm
    install
    --send-metrics=false
    --package-lock=false
    --update-notifier=false
    .
    )
  "${DK_CMD[@]}" || return $?
  echo
  echo 'Gonna fix permissions (usually, no files should be affected):'
  sudo chown --reference . --changes -- node_modules/ || return $?
  echo
  echo 'Cleaning up some potential traps:'
  rm -- package-lock.json 2>/dev/null
  echo
  echo 'All done.'
}



dinst "$@"; exit $?
