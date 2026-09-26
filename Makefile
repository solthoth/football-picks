.PHONY: help fetch-schedule scaffold-picks

SEASON ?= $(shell date +%Y)
FORCE_FLAG := $(if $(FORCE),--force,)

help:
	@echo "Targets (see scripts/ and README.md's Scripts section for details):"
	@echo ""
	@echo "  make fetch-schedule WEEK=<n> [SEASON=<year>]"
	@echo "      Fetch/refresh that week's schedule into"
	@echo "      data/nfl_pool_week-<n>_results-<season>.yaml"
	@echo ""
	@echo "  make scaffold-picks WEEK=<n> POT=<amount> [SEASON=<year>] [FORCE=1]"
	@echo "      Fetch that week's schedule, then write a picks-file scaffold"
	@echo "      (data/nfl_pool_week-<n>_picks.yaml) with the games section"
	@echo "      filled in and a Sample participant to duplicate once you know"
	@echo "      who's in that week's pool. FORCE=1 overwrites an existing file."

fetch-schedule:
	@if [ -z "$(WEEK)" ]; then \
		echo "WEEK is required, e.g. make fetch-schedule WEEK=3"; \
		exit 1; \
	fi
	python3 scripts/fetch_nfl_schedule.py --season $(SEASON) --weeks $(WEEK)

scaffold-picks:
	@if [ -z "$(WEEK)" ]; then \
		echo "WEEK is required, e.g. make scaffold-picks WEEK=3 POT=180"; \
		exit 1; \
	fi
	@if [ -z "$(POT)" ]; then \
		echo "POT is required, e.g. make scaffold-picks WEEK=3 POT=180"; \
		exit 1; \
	fi
	$(MAKE) fetch-schedule WEEK=$(WEEK) SEASON=$(SEASON)
	python3 scripts/scaffold_picks.py --season $(SEASON) --week $(WEEK) --pot $(POT) $(FORCE_FLAG)
