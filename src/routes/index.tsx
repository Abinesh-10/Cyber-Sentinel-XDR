import { createFileRoute } from "@tanstack/react-router";
import { MatrixRain } from "@/components/cyber/MatrixRain";
import { NavBar } from "@/components/cyber/NavBar";
import { Footer } from "@/components/cyber/Footer";
import { SOCProvider, useSOC } from "@/components/cyber/SOCContext";
import { HomeView } from "@/components/cyber/HomeView";
import { SOCCommandCenter } from "@/components/cyber/SOCCommandCenter";
import { ThreatIntelPage } from "@/components/cyber/ThreatIntelPage";
import { NetworkTopology } from "@/components/cyber/NetworkTopology";
import { AttackSimulation } from "@/components/cyber/AttackSimulation";
import { IncidentResponse } from "@/components/cyber/IncidentResponse";
import { ReportsAnalyticsPage } from "@/components/cyber/ReportsAnalyticsPage";
import { AICISOChat } from "@/components/cyber/AICISOChat";
import { SoundSettings } from "@/components/cyber/SoundSettings";
import { EnterpriseHub } from "@/components/cyber/EnterpriseHub";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberSentinel SOC — AI Security Operations Platform" },
      {
        name: "description",
        content:
          "Enterprise-grade Security Operations Center, real-time threat maps, breach contagion animations, and autonomous AI analysts.",
      },
      { property: "og:title", content: "CyberSentinel AI SOC Platform" },
      {
        property: "og:description",
        content: "AI-Powered Network Intrusion Simulation & Breach Contagion Platform.",
      },
    ],
  }),
  component: IndexWrapper,
});

function IndexWrapper() {
  return (
    <SOCProvider>
      <Index />
    </SOCProvider>
  );
}

function Index() {
  const { activeTab } = useSOC();

  const isHome = activeTab === "home";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground font-mono">
      <MatrixRain opacity={0.04} />
      <NavBar />

      <main
        className={`mx-auto w-full max-w-[1600px] px-4 pb-16 lg:px-6 min-h-[calc(100vh-140px)] ${
          isHome ? "pt-16" : "pt-24 lg:pt-28"
        }`}
      >
        {activeTab === "home" && <HomeView />}
        {activeTab === "command-center" && <SOCCommandCenter />}
        {activeTab === "threat-intel" && <ThreatIntelPage />}
        {activeTab === "network-topology" && <NetworkTopology />}
        {activeTab === "attack-simulator" && <AttackSimulation />}
        {activeTab === "incident-response" && <IncidentResponse />}
        {activeTab === "reports-analytics" && <ReportsAnalyticsPage />}
        {activeTab === "ai-analyst" && <AICISOChat inline={true} />}
        {activeTab === "enterprise" && <EnterpriseHub />}
      </main>

      {/* Floating chat assistant is accessible on all pages except when in full-screen CISO chat mode */}
      {activeTab !== "ai-analyst" && <AICISOChat />}
      
      <SoundSettings />
      <Footer />
    </div>
  );
}
