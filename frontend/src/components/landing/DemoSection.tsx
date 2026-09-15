import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface DemoSectionProps {
    onTryDemo: () => void;
    isTryingDemo?: boolean;
}

export function DemoSection({ onTryDemo, isTryingDemo = false }: DemoSectionProps) {
    return (
        <section id="demo" className="py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                    See It In Action
                </h2>
                <p className="text-text-muted text-lg max-w-2xl mx-auto">
                    Experience the power of your second brain
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="relative rounded-3xl overflow-hidden border border-[#1a232c] bg-linear-to-br from-[#11181f] to-[#0a0f14] p-8 md:p-12"
            >
                <div className="aspect-video bg-[#0a0f14] rounded-2xl border border-[#0acffe]/30 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center px-6">
                        <motion.div
                            animate={isTryingDemo ? {} : {
                                scale: [1, 1.05, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <BrainCircuit className="text-[#0acffe] mx-auto mb-4" size={64} />
                        </motion.div>
                        <p className="text-text-primary text-lg font-medium mb-2">
                            Try it yourself — no signup required
                        </p>
                        <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
                            We'll spin up a real, private demo account pre-loaded with sample notes, links, and tags. It's automatically deleted after 24 hours.
                        </p>
                        <motion.div
                            whileHover={isTryingDemo ? {} : { scale: 1.05 }}
                            whileTap={isTryingDemo ? {} : { scale: 0.95 }}
                            className="inline-block"
                        >
                            <Button onClick={onTryDemo} size="lg" disabled={isTryingDemo} className="gap-2">
                                {isTryingDemo ? (
                                    <>
                                        <Spinner size="sm" className="border-[#0a0f14] border-t-transparent" />
                                        Setting up your demo…
                                    </>
                                ) : (
                                    'Try the Demo'
                                )}
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
