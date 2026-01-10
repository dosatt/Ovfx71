import React from 'react';
import {
    Layout,
    Calendar,
    CheckSquare,
    Zap,
    Layers,
    Shield,
    MousePointer2,
    BarChart3,
    Cpu,
    Globe,
    Search,
    Command
} from 'lucide-react';

export default function DescriptionPage() {
    return (
        <div className="min-h-screen w-full bg-white text-gray-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 text-xl leading-relaxed">
            {/* Navigation / Header */}
            <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-50">
                <div className="container flex h-16 max-w-screen-2xl items-center px-6 md:px-12 mx-auto justify-between">
                    <a className="flex items-center space-x-2 font-bold text-xl tracking-tighter" href="#">
                        <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center text-white">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <span>OVFX</span>
                    </a>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                        <a className="transition-colors hover:text-black text-gray-500" href="#philosophy">Philosophy</a>
                        <a className="transition-colors hover:text-black text-gray-500" href="#workflow">Workflow</a>
                        <a className="transition-colors hover:text-black text-gray-500" href="#features">Features</a>
                        <a className="transition-colors hover:text-black text-gray-500" href="#tech">Under the Hood</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 hidden sm:inline-block">v7.1-beta</span>
                        <button className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                            Get Started
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-48 pb-64 md:pt-64 md:pb-80">
                    <div className="container px-6 md:px-12 mx-auto relative z-10 flex flex-col items-center text-center">
                        <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600 mb-8 animate-fade-in-up">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                            Reimagining the local workspace
                        </div>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-gray-900 mb-12 max-w-5xl leading-[0.95]">
                            Focus on what <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">truly matters.</span>
                        </h1>
                        <p className="text-2xl text-gray-600 max-w-3xl mb-16 leading-relaxed font-light">
                            OVFX is a high-performance workspace designed for flow states.
                            Combine documents, infinite canvases, and databases into a single, fluid interface.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <a href="#philosophy" className="h-12 px-8 rounded-full bg-black text-white flex items-center justify-center font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                                Read the Manifesto
                            </a>
                            <a href="#workflow" className="h-12 px-8 rounded-full bg-white border border-gray-200 text-gray-900 flex items-center justify-center font-medium hover:bg-gray-50 transition-all">
                                See how it works
                            </a>
                        </div>
                    </div>

                    {/* Abstract Background Decoration */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] opacity-30 pointer-events-none -z-10">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full blur-3xl" />
                    </div>
                </section>

                {/* Philosophy Section */}
                <section id="philosophy" className="py-64 bg-gray-50 border-y border-gray-100">
                    <div className="container px-6 md:px-12 mx-auto">
                        <div className="grid md:grid-cols-2 gap-32 items-center">
                            <div>
                                <h2 className="text-5xl font-bold mb-12 tracking-tight">Built for Flow State</h2>
                                <div className="space-y-8 text-xl text-gray-600 leading-relaxed font-light">
                                    <p>
                                        Modern tools often become the distraction they were meant to solve. Notifications, clutter, and context switching fragment your attention, making deep work impossible.
                                    </p>
                                    <p>
                                        OVFX takes a different approach. We believe in <strong>Spatial Computing</strong> on a 2D plane. Your ideas shouldn't be trapped in rigid lists; they should breathe on an infinite canvas.
                                    </p>
                                    <p>
                                        We prioritize <strong>Type 1 Interactions</strong>—actions that feel instantaneous and physical, like dragging a card or drawing a line. This reduces cognitive load, keeping you in the zone.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-12">
                                <div className="p-16 bg-white rounded-[3rem] shadow-sm border border-gray-100">
                                    <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-10">
                                        <Zap size={32} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-6 text-2xl tracking-tight">Zero Latency</h3>
                                    <p className="text-lg text-gray-500 font-light leading-relaxed">Local-first architecture means interactions happen in less than 16ms.</p>
                                </div>
                                <div className="p-24 bg-white rounded-[4rem] shadow-sm border border-gray-100 mt-32">
                                    <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-10">
                                        <Shield size={32} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-6 text-2xl tracking-tight">Privacy First</h3>
                                    <p className="text-lg text-gray-500 font-light leading-relaxed">Your data lives on your device. No cloud mandates, no tracking.</p>
                                </div>
                                <div className="p-16 bg-white rounded-[3rem] shadow-sm border border-gray-100">
                                    <div className="h-16 w-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-10">
                                        <Layers size={32} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-6 text-2xl tracking-tight">Context Rich</h3>
                                    <p className="text-lg text-gray-500 font-light leading-relaxed">Link anything to anything. See the web of your knowledge.</p>
                                </div>
                                <div className="p-24 bg-white rounded-[4rem] shadow-sm border border-gray-100 mt-32">
                                    <div className="h-16 w-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-10">
                                        <Cpu size={32} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-6 text-2xl tracking-tight">AI Augmented</h3>
                                    <p className="text-lg text-gray-500 font-light leading-relaxed">Intelligence that assists, rather than replaces, your thinking process.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Expanded Workflow Section */}
                <section id="workflow" className="py-64">
                    <div className="container px-6 md:px-12 mx-auto">
                        <div className="text-center max-w-4xl mx-auto mb-32">
                            <h2 className="text-6xl font-extrabold mb-10 tracking-tighter">The Creative Loop</h2>
                            <p className="text-2xl text-gray-600 font-light leading-relaxed">A system designed to move you from vague idea to shipped product.</p>
                        </div>

                        <div className="space-y-[32rem]">
                            {/* Step 1 */}
                            <div className="grid md:grid-cols-2 gap-32 items-center">
                                <div className="order-2 md:order-1 bg-gray-50 rounded-3xl p-8 border border-gray-100 aspect-video flex items-center justify-center shadow-inner">
                                    <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 space-y-3">
                                        <div className="h-2 w-20 bg-gray-200 rounded"></div>
                                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                                        <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                                        <div className="flex gap-2 mt-4">
                                            <div className="h-8 w-8 rounded-full bg-blue-100"></div>
                                            <div className="h-8 w-8 rounded-full bg-green-100"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="order-1 md:order-2">
                                    <div className="text-blue-600 font-bold mb-2 text-lg">01. Capture</div>
                                    <h3 className="text-3xl font-bold mb-4">The Universal Inbox</h3>
                                    <p className="text-lg text-gray-600 mb-6">
                                        Don't let ideas escape. Use the global shortcut (Cmd+K) to quick-capture thoughts, tasks, and web clippings instantly. Everything lands in your Inbox, ready for processing.
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-blue-500" />
                                            <span>Web clipper extension</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-blue-500" />
                                            <span>Voice memos with auto-transcription</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-blue-500" />
                                            <span>Instant Markdown notes</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="grid md:grid-cols-2 gap-32 items-center">
                                <div>
                                    <div className="text-indigo-600 font-bold mb-2 text-lg">02. Organize</div>
                                    <h3 className="text-3xl font-bold mb-4">Spatial Thinking</h3>
                                    <p className="text-lg text-gray-600 mb-6">
                                        Move from lists to maps. Organize your project on an infinite canvas. Group related tasks, attach files, and draw connections between disparate ideas to reveal new insights.
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-indigo-500" />
                                            <span>Infinite Whiteboard</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-indigo-500" />
                                            <span>Bi-directional linking</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-indigo-500" />
                                            <span>Visual moodboards</span>
                                        </li>
                                    </ul>
                                </div>
                                <img src="/assets/description/canvas-ui.png" alt="Canvas Interface" className="w-full h-full object-cover rounded-xl shadow-lg transform transition-transform hover:scale-105 duration-500" />
                            </div>

                            {/* Step 3 */}
                            <div className="grid md:grid-cols-2 gap-32 items-center">
                                <img src="/assets/description/calendar-ui.png" alt="Calendar Interface" className="w-full h-full object-cover rounded-xl shadow-lg transform transition-transform hover:scale-105 duration-500" />
                                <div className="order-1 md:order-2">
                                    <div className="text-purple-600 font-bold mb-2 text-lg">03. Execute</div>
                                    <h3 className="text-3xl font-bold mb-4">Deep Focus Mode</h3>
                                    <p className="text-lg text-gray-600 mb-6">
                                        When it's time to work, clutter vanishes. Focus Mode dims everything except your current active task. The integrated Pomodoro timer keeps you on track.
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-purple-500" />
                                            <span>Distraction blocking</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-purple-500" />
                                            <span>Ambient soundscapes</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <CheckSquare size={18} className="text-purple-500" />
                                            <span>Session analytics</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-80 bg-gray-900 text-white">
                    <div className="container px-6 md:px-12 mx-auto">
                        <div className="mb-32">
                            <h2 className="text-4xl font-bold mb-6">Power User Features</h2>
                            <p className="text-xl text-gray-400 max-w-2xl">
                                Designed for those who live in their tools. Every interaction is optimized for speed and keyboard controllability.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-32">
                            {[
                                { icon: MousePointer2, title: "Drag & Drop", desc: "Fluid physics-based interactions." },
                                { icon: Command, title: "Command Palette", desc: "Access any action without lifting hands." },
                                { icon: Layout, title: "Split Views", desc: "Multi-pane capability for referencing." },
                                { icon: Globe, title: "Offline First", desc: "Works perfectly without internet." },
                                { icon: Layers, title: "Version History", desc: "Infinite undo and diff view." },
                                { icon: Search, title: "Full-Text Search", desc: "Instant indexing of all content." },
                                { icon: Calendar, title: "2-Way Sync", desc: "Google & Outlook Calendar support." },
                                { icon: BarChart3, title: "Analytics", desc: "Track your productivity trends." },
                                { icon: Cpu, title: "Plugin System", desc: "Extend functionality with JS." },
                                { icon: Shield, title: "E2E Encryption", desc: "Your data is mathematically private." },
                                { icon: Zap, title: "Performance", desc: "Built on Rust core for speed." },
                                { icon: CheckSquare, title: "Templates", desc: "Community driven starter kits." }
                            ].map((feature, i) => (
                                <div key={i} className="p-20 rounded-[3rem] bg-gray-800/50 border border-gray-100 hover:bg-gray-800 transition-all duration-700 hover:-translate-y-12 shadow-2xl">
                                    <feature.icon className="mb-4 text-blue-400" size={24} />
                                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Use Cases Section */}
                <section className="py-80 bg-gray-50">
                    <div className="container px-6 md:px-12 mx-auto">
                        <h2 className="text-5xl font-extrabold mb-24 text-center tracking-tighter">Built for every workflow</h2>
                        <div className="grid md:grid-cols-3 gap-24">
                            <div className="bg-white p-20 rounded-[4rem] shadow-sm border border-gray-100">
                                <h3 className="text-3xl font-bold mb-10 text-blue-600 tracking-tight">For Developers</h3>
                                <p className="text-xl text-gray-600 mb-12 leading-relaxed font-light">
                                    Plan architectures on the canvas. Store code snippets with syntax highlighting. Sync tasks with GitHub issues seamlessly.
                                </p>
                                <div className="text-sm font-medium text-gray-900 border-t border-gray-100 pt-4">
                                    "Basically my second brain for coding."
                                </div>
                            </div>
                            <div className="bg-white p-20 rounded-[4rem] shadow-sm border border-gray-100">
                                <h3 className="text-3xl font-bold mb-10 text-purple-600 tracking-tight">For Designers</h3>
                                <p className="text-xl text-gray-600 mb-12 leading-relaxed font-light">
                                    Create moodboards, organize assets, and manage client feedback loops. A visual database for visual minds.
                                </p>
                                <div className="text-sm font-medium text-gray-900 border-t border-gray-100 pt-4">
                                    "Finally, a tool that looks as good as my work."
                                </div>
                            </div>
                            <div className="bg-white p-20 rounded-[4rem] shadow-sm border border-gray-100">
                                <h3 className="text-3xl font-bold mb-10 text-orange-600 tracking-tight">For Managers</h3>
                                <p className="text-xl text-gray-600 mb-12 leading-relaxed font-light">
                                    See the big picture. Track OKRs alongside daily tasks. Generate reports automatically from team activity.
                                </p>
                                <div className="text-sm font-medium text-gray-900 border-t border-gray-100 pt-4">
                                    "Keeps the chaos organized."
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Technical / Footer Section */}
                <section id="tech" className="py-48 border-t border-gray-200">
                    <div className="container px-6 md:px-12 mx-auto">
                        <div className="grid md:grid-cols-4 gap-12">
                            <div className="col-span-2">
                                <a className="flex items-center space-x-2 font-bold text-xl tracking-tighter mb-4" href="#">
                                    <Zap size={20} />
                                    <span>OVFX</span>
                                </a>
                                <p className="text-gray-500 max-w-sm mb-6">
                                    Open Visual Effects (OVFX) - The workspace for the next generation of builders.
                                    London, UK.
                                </p>
                                <div className="flex gap-4">
                                    {/* Social Placeholders */}
                                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold mb-4">Product</h4>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li><a href="#" className="hover:text-black">Download</a></li>
                                    <li><a href="#" className="hover:text-black">Changelog</a></li>
                                    <li><a href="#" className="hover:text-black">Roadmap</a></li>
                                    <li><a href="#" className="hover:text-black">Pricing</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-4">Legal</h4>
                                <ul className="space-y-2 text-gray-600 text-sm">
                                    <li><a href="#" className="hover:text-black">Privacy Policy</a></li>
                                    <li><a href="#" className="hover:text-black">Terms of Service</a></li>
                                    <li><a href="#" className="hover:text-black">Cookie Policy</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
                            © {new Date().getFullYear()} OVFX Inc. All rights reserved.
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
