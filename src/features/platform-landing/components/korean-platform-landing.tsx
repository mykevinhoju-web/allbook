"use client";

import { Search } from "lucide-react";
import { type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AllBookLogo } from "./allbook-logo";

const QUICK_MENUS = ["FREE", "예약", "내 주변", "DEAL"] as const;

/**
 * Search-first home for kor.allbook.com.au only.
 * Submit is visual-only — matching is not wired in this pass.
 */
export function KoreanPlatformLanding() {
  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div className="flex min-h-svh flex-col bg-white text-neutral-950">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-16 sm:px-6">
        <AllBookLogo
          size="lg"
          variant="blue"
          layout="vertical"
          className="mb-8 sm:mb-10"
        />

        <h1 className="text-center text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[1.75rem]">
          무엇을 찾고 계세요?
        </h1>

        <form onSubmit={onSearch} className="mt-7 w-full sm:mt-8">
          <label htmlFor="kor-home-search" className="sr-only">
            검색
          </label>
          <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] focus-within:border-neutral-400 focus-within:shadow-[0_10px_36px_rgba(15,23,42,0.1)]">
            <Search
              className="ml-1 size-5 shrink-0 text-neutral-400"
              aria-hidden
            />
            <Input
              id="kor-home-search"
              name="q"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="싼 미용실 찾아줘"
              className="h-11 border-0 bg-transparent px-1 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 md:h-12 md:text-base dark:bg-transparent"
            />
            <Button
              type="submit"
              className="mr-0.5 h-10 rounded-full px-4 sm:px-5"
            >
              검색
            </Button>
          </div>
        </form>

        <nav
          aria-label="빠른 메뉴"
          className="mt-6 flex w-full flex-wrap items-center justify-center gap-2"
        >
          {QUICK_MENUS.map((label) => (
            <Button
              key={label}
              type="button"
              variant="secondary"
              className="h-9 rounded-full px-4 text-[13px] font-medium tracking-wide"
            >
              {label}
            </Button>
          ))}
        </nav>
      </main>
    </div>
  );
}
