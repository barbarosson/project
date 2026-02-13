'use client'

import { ArrowRight, Rocket, Zap, Download, CheckCircle } from 'lucide-react'

export default function NeonButtonsDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Neon Glow Button System
          </h1>
          <p className="text-xl text-blue-200 mb-8">
            High-impact, reusable button components for Deep Tech interfaces
          </p>
          <div className="inline-block bg-blue-900/30 border border-blue-500/30 rounded-lg px-6 py-3">
            <p className="text-sm text-blue-300 font-mono">
              Color Palette: Bright Cobalt (#1E40AF) + Ice Blue (#7DD3FC)
            </p>
          </div>
        </div>

        <div className="space-y-16">
          <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
            <h2 className="text-3xl font-bold text-white mb-6">Standard Button (.btn-glow)</h2>
            <p className="text-blue-200 mb-8">
              The primary neon glow button with impressive hover effects. Perfect for CTAs and primary actions.
            </p>

            <div className="flex flex-wrap gap-6 mb-8">
              <button className="btn-glow">
                Get Started
              </button>

              <button className="btn-glow">
                <Rocket className="w-5 h-5 mr-2" />
                Launch Project
              </button>

              <button className="btn-glow">
                View Details
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>

              <button className="btn-glow" disabled>
                Disabled State
              </button>
            </div>

            <div className="bg-slate-950/70 rounded-lg p-4 border border-blue-500/10">
              <pre className="text-sm text-blue-300 overflow-x-auto">
                <code>{`<button className="btn-glow">Get Started</button>
<button className="btn-glow">
  <Rocket className="w-5 h-5 mr-2" />
  Launch Project
</button>`}</code>
              </pre>
            </div>
          </section>

          <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
            <h2 className="text-3xl font-bold text-white mb-6">Size Variants</h2>
            <p className="text-blue-200 mb-8">
              Multiple size options: .btn-glow-sm, .btn-glow (default), .btn-glow-lg, .btn-glow-xl
            </p>

            <div className="flex flex-wrap items-center gap-6 mb-8">
              <button className="btn-glow-sm">
                Small Button
              </button>

              <button className="btn-glow">
                Default Size
              </button>

              <button className="btn-glow-lg">
                <Zap className="w-6 h-6 mr-2" />
                Large Button
              </button>

              <button className="btn-glow-xl">
                Extra Large
              </button>
            </div>

            <div className="bg-slate-950/70 rounded-lg p-4 border border-blue-500/10">
              <pre className="text-sm text-blue-300 overflow-x-auto">
                <code>{`<button className="btn-glow-sm">Small Button</button>
<button className="btn-glow">Default Size</button>
<button className="btn-glow-lg">Large Button</button>
<button className="btn-glow-xl">Extra Large</button>`}</code>
              </pre>
            </div>
          </section>

          <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
            <h2 className="text-3xl font-bold text-white mb-6">Outline Variant (.btn-glow-outline)</h2>
            <p className="text-blue-200 mb-8">
              Transparent with glowing border. Fills with glow on hover for a dramatic effect.
            </p>

            <div className="flex flex-wrap gap-6 mb-8">
              <button className="btn-glow-outline">
                Learn More
              </button>

              <button className="btn-glow-outline">
                <Download className="w-5 h-5 mr-2" />
                Download
              </button>

              <button className="btn-glow-outline">
                Documentation
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>

            <div className="bg-slate-950/70 rounded-lg p-4 border border-blue-500/10">
              <pre className="text-sm text-blue-300 overflow-x-auto">
                <code>{`<button className="btn-glow-outline">Learn More</button>`}</code>
              </pre>
            </div>
          </section>

          <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
            <h2 className="text-3xl font-bold text-white mb-6">Real-World Examples</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 border border-blue-500/30">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Hero Section CTA
                </h3>
                <p className="text-blue-200 mb-6">
                  Transform your business with cutting-edge AI solutions
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="btn-glow-lg">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                  <button className="btn-glow-outline">
                    Watch Demo
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 border border-blue-500/30">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Feature Card
                </h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-blue-200">
                    <CheckCircle className="w-5 h-5 mr-2 text-blue-400" />
                    Real-time analytics
                  </div>
                  <div className="flex items-center text-blue-200">
                    <CheckCircle className="w-5 h-5 mr-2 text-blue-400" />
                    AI-powered insights
                  </div>
                  <div className="flex items-center text-blue-200">
                    <CheckCircle className="w-5 h-5 mr-2 text-blue-400" />
                    24/7 support
                  </div>
                </div>
                <button className="btn-glow w-full">
                  <Rocket className="w-5 h-5 mr-2" />
                  Get Started Now
                </button>
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/20">
            <h2 className="text-3xl font-bold text-white mb-6">Technical Details</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-950/70 rounded-lg p-6 border border-blue-500/10">
                <h3 className="text-lg font-semibold text-white mb-3">Color Values</h3>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li><span className="font-mono text-blue-400">Background:</span> #1E40AF (Bright Cobalt)</li>
                  <li><span className="font-mono text-blue-400">Glow:</span> #7DD3FC (Ice Blue)</li>
                  <li><span className="font-mono text-blue-400">Text:</span> #FFFFFF (White)</li>
                </ul>
              </div>

              <div className="bg-slate-950/70 rounded-lg p-6 border border-blue-500/10">
                <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li>Layered box-shadow for depth</li>
                  <li>Smooth 300ms transitions</li>
                  <li>Hover lift effect (2px)</li>
                  <li>Focus-visible accessibility</li>
                  <li>Disabled state handling</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-slate-950/70 rounded-lg p-6 border border-blue-500/10">
              <h3 className="text-lg font-semibold text-white mb-3">Implementation</h3>
              <p className="text-blue-200 text-sm mb-4">
                All styles are defined in <code className="px-2 py-1 bg-slate-900 rounded text-blue-400">app/globals.css</code> using Tailwind&apos;s <code className="px-2 py-1 bg-slate-900 rounded text-blue-400">@layer components</code> directive. Simply add the class name to any button element.
              </p>
              <div className="bg-slate-900 rounded p-4">
                <pre className="text-xs text-blue-300 overflow-x-auto">
                  <code>{`// In your component
<button className="btn-glow">Click Me</button>
<button className="btn-glow-outline">Or Me</button>
<button className="btn-glow-lg">Big Button</button>`}</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="text-center bg-gradient-to-r from-blue-900/30 via-blue-800/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-12 border border-blue-500/30">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to add some electric energy to your UI?
            </h2>
            <p className="text-xl text-blue-200 mb-8">
              Use these button classes throughout your Deep Tech application
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn-glow-lg">
                <Zap className="w-5 h-5 mr-2" />
                Start Building
              </button>
              <button className="btn-glow-outline">
                View Documentation
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center text-blue-300 text-sm">
          <p>Hover over any button to see the impressive neon glow effect in action</p>
        </div>
      </div>
    </div>
  )
}
