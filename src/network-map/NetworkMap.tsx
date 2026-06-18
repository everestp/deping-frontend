import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { nodeLocations } from "../data/nodes";


export function NetworkMap() {
  return (
    <section id="network" className="relative px-4 sm:px-6 py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Live network
          </div>

          <h2 className="mt-4 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            <span className="text-gradient">2,431 nodes</span> across 87 countries
          </h2>

          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Every monitor runs from real residential, edge, and datacenter nodes operated by an
            incentivized global community.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl glass overflow-hidden p-4 sm:p-8"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "var(--gradient-mesh)" }}
          />

          <div className="relative aspect-[2/1] w-full rounded-2xl overflow-hidden">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              scrollWheelZoom={false}
              className="h-full w-full z-10"
            >
              {/* Dark map style */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap & CARTO"
              />

              {nodeLocations.map((n, _) => (
                <CircleMarker
                  key={n.id}
                  center={[n.coords[1], n.coords[0]]} // Leaflet = [lat, lng]
                  radius={6}
                  pathOptions={{
                    color: "rgba(0, 255, 170, 0.8)",
                    fillColor: "rgba(0, 255, 170, 0.4)",
                    fillOpacity: 0.6,
                    weight: 1,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                    Node {n.id}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}