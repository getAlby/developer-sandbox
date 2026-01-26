import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { scenarios } from "@/data/scenarios";
import { WALLET_PERSONAS } from "@/types/wallet";

const slides = [
  {
    title: "Meet Alice & Bob",
    content: (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-12 text-7xl">
          <div className="flex flex-col items-center gap-2">
            <span>{WALLET_PERSONAS.alice.emoji}</span>
            <span className="text-lg font-medium text-foreground">Alice</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span>{WALLET_PERSONAS.bob.emoji}</span>
            <span className="text-lg font-medium text-foreground">Bob</span>
          </div>
        </div>
        <p className="text-center text-lg text-muted-foreground">
          They'll be sending payments to each other.
        </p>
      </div>
    ),
  },
  {
    title: "The Native Currency of the AI Age",
    content: (
      <div className="flex flex-col items-center gap-6">
        <span className="text-7xl">⚡</span>
        <p className="text-center text-lg text-muted-foreground">
          Bitcoin is the permissionless payment layer for the internet.
        </p>
        <p className="text-center text-lg text-muted-foreground">
          Lightning makes it instant, cheap, and perfect for apps and autonomous
          agents.
        </p>
        <p className="text-center text-lg text-muted-foreground">
          NWC connects apps and autonomous agents to lightning wallets.
        </p>
      </div>
    ),
  },
  {
    title: "Explore Real-World Scenarios",
    content: (
      <div className="flex flex-col items-center gap-6">
        <span className="text-7xl">🚀</span>
        <p className="text-center text-lg text-muted-foreground">
          Use the interactive sandbox to test NWC connections and explore
          real-world Lightning use cases with specific code examples for your
          app.
        </p>

        <p className="text-center text-lg text-muted-foreground">
          Test wallets allow you to instantly get started without any setup.
          Jumpstart your development with pre-built scenarios designed for
          real-world Bitcoin use cases.
        </p>
      </div>
    ),
  },
];

export function GettingStarted() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-6">
      <div className="flex max-w-2xl flex-col items-center gap-10">
        <div
          key={currentSlide}
          className="flex h-96 sm:h-80 animate-in fade-in duration-300 flex-col items-center justify-center gap-6"
        >
          <h1 className="text-3xl font-bold text-center">
            {slides[currentSlide].title}
          </h1>
          {slides[currentSlide].content}
        </div>

        <div className="flex flex-col items-center gap-6">
          {isLastSlide ? (
            <Button asChild>
              <Link to={`/${scenarios[0].id}`}>
                Try the first scenario &rarr;
              </Link>
            </Button>
          ) : (
            <Button onClick={() => setCurrentSlide((s) => s + 1)}>
              Next &rarr;
            </Button>
          )}

          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === currentSlide ? "bg-primary" : "bg-muted"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
