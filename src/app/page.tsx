"use client"; // Required for Tabs and client-side components

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KitchenForm from "@/components/granite/KitchenForm";
import ThresholdForm from "@/components/granite/ThresholdForm";
import WashbasinForm from "@/components/granite/WashbasinForm";
import TombstoneForm from "@/components/granite/TombstoneForm";
import { Utensils, Square, Archive, Landmark } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Orçamento de Granito</h1>
        <p className="text-muted-foreground">Calcule o valor exato para seu projeto em granito</p>
      </header>

      <Tabs defaultValue="cozinha" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto sm:h-10 mb-6">
          <TabsTrigger value="cozinha" className="py-2 sm:py-1.5">
            <Utensils className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Cozinha</span><span className="sm:hidden">Coz.</span>
          </TabsTrigger>
          <TabsTrigger value="soleira" className="py-2 sm:py-1.5">
            <Square className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Soleira</span><span className="sm:hidden">Sol.</span>
          </TabsTrigger>
          <TabsTrigger value="lavatorio" className="py-2 sm:py-1.5">
            <Archive className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Lavatório</span><span className="sm:hidden">Lav.</span>
          </TabsTrigger>
          <TabsTrigger value="tumulo" className="py-2 sm:py-1.5">
            <Landmark className="mr-0 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Túmulo</span><span className="sm:hidden">Túm.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cozinha" className="bg-card p-6 rounded-xl shadow-lg">
          <KitchenForm />
        </TabsContent>
        <TabsContent value="soleira" className="bg-card p-6 rounded-xl shadow-lg">
          <ThresholdForm />
        </TabsContent>
        <TabsContent value="lavatorio" className="bg-card p-6 rounded-xl shadow-lg">
          <WashbasinForm />
        </TabsContent>
        <TabsContent value="tumulo" className="bg-card p-6 rounded-xl shadow-lg">
          <TombstoneForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
