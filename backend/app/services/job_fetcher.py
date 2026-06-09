import requests
from typing import List, Dict, Any
import os


class JobFetcher:
    def __init__(self):
        self.adzuna_app_id = os.getenv("ADZUNA_APP_ID")
        self.adzuna_app_key = os.getenv("ADZUNA_APP_KEY")
        self.jsearch_api_key = os.getenv("JSEARCH_API_KEY")

    def fetch_all_jobs(self) -> List[Dict[str, Any]]:
        jobs = []

        # General/global jobs
        jobs.extend(self.fetch_jsearch_jobs(query="remote jobs"))
        jobs.extend(self.fetch_jsearch_jobs(query="international jobs"))

        # Nigeria-focused jobs
        nigeria_queries = [

            "jobs in Nigeria",
            "Lagos jobs",
            "Abuja jobs",
            "Port Harcourt jobs",
            "Kano jobs",

            "graduate trainee Nigeria",
            "entry level jobs Nigeria",
            "NYSC jobs",

            "banking jobs Nigeria",
            "telecom jobs Nigeria",
            "oil and gas jobs Nigeria",

            "data analyst Nigeria",
            "business analyst Nigeria",
            "software engineer Nigeria",
            "cybersecurity Nigeria",

            "remote jobs Nigeria",
            "work from home Nigeria",

            "finance jobs Nigeria",
            "accounting jobs Nigeria",
            "sales jobs Nigeria",
            "marketing jobs Nigeria",
        ]

        for query in nigeria_queries:
            jobs.extend(self.fetch_jsearch_jobs(query=query, force_country="Nigeria"))

        # Adzuna
        jobs.extend(self.fetch_adzuna_jobs(country="gb"))
        jobs.extend(self.fetch_adzuna_jobs(country="us"))
        jobs.extend(self.fetch_adzuna_jobs(country="ng"))

        # RemoteOK
        jobs.extend(self.fetch_remoteok_jobs())

        return jobs

    def fetch_adzuna_jobs(self, country: str = "gb") -> List[Dict[str, Any]]:
        if not self.adzuna_app_id or not self.adzuna_app_key:
            return []

        url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"

        params = {
            "app_id": self.adzuna_app_id,
            "app_key": self.adzuna_app_key,
            "results_per_page": 50,
            "content-type": "application/json"
        }

        try:
            response = requests.get(url, params=params, timeout=20)
            response.raise_for_status()
            data = response.json()
            return [
                {
                    "provider": "adzuna",
                    "country": country,
                    "raw": item
                }
                for item in data.get("results", [])
            ]
        except Exception as e:
            print(f"Adzuna fetch error for {country}: {e}")
            return []

    def fetch_remoteok_jobs(self) -> List[Dict[str, Any]]:
        url = "https://remoteok.com/api"

        try:
            response = requests.get(
                url,
                headers={"User-Agent": "ChumcredJobBank/1.0"},
                timeout=20
            )
            response.raise_for_status()
            data = response.json()

            return [
                {
                    "provider": "remoteok",
                    "country": "Global",
                    "raw": item
                }
                for item in data
                if isinstance(item, dict) and item.get("position")
            ]
        except Exception as e:
            print(f"RemoteOK fetch error: {e}")
            return []

    def fetch_jsearch_jobs(
        self,
        query: str = "jobs",
        force_country: str | None = None
    ) -> List[Dict[str, Any]]:
        if not self.jsearch_api_key:
            return []

        url = "https://jsearch.p.rapidapi.com/search"

        headers = {
            "X-RapidAPI-Key": self.jsearch_api_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }

        params = {
            "query": query,
            "page": "1",
            "num_pages": "1"
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=20)
            response.raise_for_status()
            data = response.json()

            return [
                {
                    "provider": "jsearch",
                    "country": force_country or "Global",
                    "query": query,
                    "raw": item
                }
                for item in data.get("data", [])
            ]
        except Exception as e:
            print(f"JSearch fetch error for query '{query}': {e}")
            return []