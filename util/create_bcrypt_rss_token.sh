#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function create_bcrypt_rss_token () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  which htpasswd |& grep -qPe '^/' || return $(
    echo 'E: Cannot find htpasswd.' \
      'Try installing apt package apache2-utils.' >&2)
  local KEY="$(head --bytes=30 -- /dev/urandom | base64 | tr /+ _-)"
  local HASH="$(htpasswd -inB . <<<"$KEY")"
  HASH="${HASH#*:}"
  echo "?key=$KEY     ->     keyHash: '$HASH'"
}










create_bcrypt_rss_token "$@"; exit $?
