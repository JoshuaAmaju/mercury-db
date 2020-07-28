# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.2] - 2020-07-28

### Fixed

- Fix issue with deleting unmatched items during a match query, due to still holding a reference to unmatched items.
- Fix issue with saving of entire property object in relationship start and end references with actual node ids.
- Pass arguments to where function in query in the order in which the Node aliases (if present) were declared in query.
