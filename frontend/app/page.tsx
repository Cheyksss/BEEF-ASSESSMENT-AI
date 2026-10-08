import Link from "next/link"
import { Beef, Sparkles, ShieldCheck, Layers, PieChart, ArrowRight, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28 px-4 flex flex-col items-center text-center">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-red-600/15 via-rose-500/15 to-amber-500/15 blur-3xl rounded-full -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Generation Deep Learning & CV Meat Grading
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl text-foreground leading-[1.1]">
          Automated Beef Quality Evaluation Powered by{" "}
          <span className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            ReXNet-150
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Instantly evaluate Freshness state, Marbling lipid distribution, and HSV visible fat ratio.
          Produces a standardized, reliable Meat Quality Score (MQS) in milliseconds.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/assess">
            <Button className="h-12 px-8 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-2xl shadow-xl shadow-red-500/25 gap-2 text-sm transition-all hover:scale-[1.02]">
              Start Quality Assessment
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="h-12 px-8 rounded-2xl text-sm font-semibold border-border/80">
              View Analytics Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card/70 backdrop-blur-md shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Binary Freshness Detection</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Trained ReXNet-150 binary classifier identifying Fresh vs Spoiled states. Automatic safety-cap prevents spoiled beef from exceeding 50 MQS.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card/70 backdrop-blur-md shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">5-Grade Marbling Analysis</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scored into small, slight, modest, moderate, and slightly abundant intramuscular lipid grain tiers, awarding up to 30 MQS points.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card/70 backdrop-blur-md shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">HSV Visible Fat Estimation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              rembg background segmentation combined with morphological closing/opening and calibrated HSV range thresholding [0,0,120] to [180,120,255].
            </p>
          </div>
        </div>
      </section>

      {/* MQS Formula Spec Banner */}
      <section className="max-w-6xl mx-auto px-4 py-8 pb-16 w-full">
        <div className="p-8 rounded-3xl border border-border/80 bg-gradient-to-br from-card/90 to-muted/40 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
              <Award className="w-4 h-4" />
              Standardized MQS Formula
            </div>
            <h3 className="text-2xl font-black text-foreground">
              MQS = Freshness (0 or 50) + Marbling (10–30) + min(Fat Ratio, 20)
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Strictly clamped to [0.0, 100.0] with spoiled constraint enforcement, providing objective, machine-verified carcass grading.
            </p>
          </div>

          <Link href="/assess">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shrink-0">
              Evaluate Cut Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
