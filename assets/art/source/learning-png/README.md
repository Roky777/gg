# Shaded learning PNG sources

Generated with the built-in ImageGen tool. The three source grids are a-i.png, j-r.png and s-z.png. Exact prompts are in prompts.json. Clean standalone kite, quilt and van sources and their prompts are under single/; these replace grid objects whose own boundaries were clipped. Source sheets are retained for reproducibility.

build-png-learning-cards.py extracts objects by alpha connectivity. It rejects secondary components touching a cell boundary to avoid neighbouring-picture fragments, preserves significant disconnected details, and overrides the three separately drawn objects. Final extracted PNGs are under objects/. The runtime copies are ../../objects/.

The current game renders these individual PNGs directly in DOM matching cards. It does not use cropped strips or the earlier precomposed SVG/PNG boards. The 27-object visual audit is at output/object-png-audit.png relative to the game root.
