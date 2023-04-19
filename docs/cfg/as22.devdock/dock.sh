#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
export DEVDOCK_DIR="$(readlink -m -- "$BASH_SOURCE"/..)"

exec docker-devdock "$@"; exit $?
# ^-- The docker-devdock command is a symlink to `devdock.sh` from
#     https://github.com/mk-pmb/docker-devel-util-pmb/tree/master/devdock
