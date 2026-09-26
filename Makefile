.PHONY: help venv fetch-schedule scaffold-picks publish-scores backfill-scores test-scripts

SEASON ?= $(shell date +%Y)
# Use the repo venv (make venv) when it exists, else the system python3.
PYTHON ?= $(if $(wildcard .venv/bin/python),.venv/bin/python,python3)
# dev unless told otherwise; prod is always an explicit ENV=prod.
ENV ?= dev
WEEKS ?= active
GATE_FLAG := $(if $(filter 1 true yes,$(GATE)),--gate,)
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
	@echo ""
	@echo "  make venv"
	@echo "      Create .venv and install scripts/requirements.txt (needed for"
	@echo "      the publish targets: Azure SDK). Other targets pick it up"
	@echo "      automatically."
	@echo ""
	@echo "  make publish-scores [ENV=dev|prod] [WEEKS=active|<n>|<a>-<b>] [GATE=1] [SEASON=<year>]"
	@echo "      Publish scores to that environment's blob storage (default:"
	@echo "      ENV=dev, WEEKS=active). GATE=1 is what cron uses: skip the NFL"
	@echo "      API unless a game is live/about to start or the published copy"
	@echo "      is missing/12h stale. Needs PLATFORM_FOUNDATION_DIR."
	@echo ""
	@echo "  make backfill-scores [ENV=dev|prod] [SEASON=<year>]"
	@echo "      One-time bootstrap for an environment: publish weeks 1-18."
	@echo ""
	@echo "  make test-scripts"
	@echo "      Unit tests for the scripts' gating logic."

venv:
	python3 -m venv .venv
	.venv/bin/pip install -r scripts/requirements.txt

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

publish-scores:
	@if [ -z "$$PLATFORM_FOUNDATION_DIR" ]; then \
		echo "PLATFORM_FOUNDATION_DIR must point at the platform-foundation checkout"; \
		exit 1; \
	fi
	$(PYTHON) scripts/fetch_nfl_schedule.py --season $(SEASON) --weeks $(WEEKS) --upload --env $(ENV) $(GATE_FLAG)

backfill-scores:
	$(MAKE) publish-scores ENV=$(ENV) SEASON=$(SEASON) WEEKS=1-18

test-scripts:
	$(PYTHON) -m unittest discover -s scripts -p "test_*.py"
