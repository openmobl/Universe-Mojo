#!/bin/bash

rm com.openmobl.app.universe_*
palm-package com.openmobl.app.universe
palm-install -d tcp com.openmobl.app.universe_*
