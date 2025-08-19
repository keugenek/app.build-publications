"""Beer counter application using client-side local storage."""

from nicegui import ui


def create():
    """Create the beer counter application."""

    @ui.page("/")
    def index():
        # Apply modern styling
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        # Add custom CSS for glass morphism and modern styling
        ui.add_head_html("""
        <style>
        .glass-card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .beer-counter {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
        }
        
        .counter-display {
            font-size: 4rem;
            font-weight: bold;
            color: #1f2937;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .beer-emoji {
            font-size: 6rem;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        .stats-card {
            background: rgba(255, 255, 255, 0.95);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        </style>
        """)

        # Define functions before using them in UI
        def update_counter(increment: int):
            """Update the beer counter by the given increment."""
            ui.run_javascript(
                f"""
                const currentCount = window.beerCounter.getCount();
                const newCount = Math.max(0, currentCount + {increment});
                
                window.beerCounter.setCount(newCount);
                
                if ({increment} > 0) {{
                    window.beerCounter.updateDailyStats(1);
                    window.beerCounter.updateWeeklyStats(1);
                    window.beerCounter.updateAllTimeCount(1);
                }}
                
                // Update all UI elements
                const count = window.beerCounter.getCount();
                const todayCount = window.beerCounter.getTodayCount();
                const weekCount = window.beerCounter.getWeekCount();
                const allTimeCount = window.beerCounter.getAllTimeCount();
                
                document.querySelectorAll('.counter-display').forEach(el => {{
                    el.textContent = count;
                }});
            """,
                timeout=1.0,
            )

            # Update the labels with current values
            ui.timer(0.1, lambda: update_display_values(), once=True)

        def update_display_values():
            """Update display values from localStorage."""
            ui.run_javascript(
                """
                const count = window.beerCounter.getCount();
                const todayCount = window.beerCounter.getTodayCount();
                const weekCount = window.beerCounter.getWeekCount();
                const allTimeCount = window.beerCounter.getAllTimeCount();
                
                // Update counter
                const counterEl = document.querySelector('.counter-display');
                if (counterEl) counterEl.textContent = count;
            """,
                timeout=1.0,
            )

        def reset_counter():
            """Reset the current counter to zero."""
            ui.run_javascript(
                """
                window.beerCounter.setCount(0);
                document.querySelectorAll('.counter-display').forEach(el => {
                    el.textContent = '0';
                });
            """,
                timeout=1.0,
            )

        def clear_statistics():
            """Clear all statistics."""
            ui.run_javascript(
                """
                window.beerCounter.clearStats();
                window.updateBeerCounterUI();
            """,
                timeout=1.0,
            )

        with ui.column().classes("beer-counter w-full items-center justify-center"):
            # Header
            ui.label("🍺 Beer Counter").classes("text-4xl font-bold text-white mb-8 text-center")

            # Main counter card
            with ui.card().classes("glass-card p-8 text-center max-w-md"):
                ui.label("🍺").classes("beer-emoji block")
                ui.label("0").classes("counter-display block mb-6")

                # Control buttons
                with ui.row().classes("gap-4 justify-center mb-4"):
                    ui.button("-", on_click=lambda: update_counter(-1)).classes(
                        "w-16 h-16 text-2xl font-bold bg-red-500 hover:bg-red-600 text-white rounded-full"
                    )
                    ui.button("+", on_click=lambda: update_counter(1)).classes(
                        "w-16 h-16 text-2xl font-bold bg-green-500 hover:bg-green-600 text-white rounded-full"
                    )

                # Reset button
                ui.button("Reset Counter", on_click=reset_counter).classes(
                    "bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
                )

            # Statistics card
            with ui.card().classes("stats-card mt-8 max-w-md w-full"):
                ui.label("Statistics").classes("text-xl font-bold text-gray-800 mb-4")

                with ui.row().classes("justify-between items-center mb-2"):
                    ui.label("Today:").classes("text-gray-600")
                    ui.label("0").classes("font-semibold text-primary")

                with ui.row().classes("justify-between items-center mb-2"):
                    ui.label("This Week:").classes("text-gray-600")
                    ui.label("0").classes("font-semibold text-primary")

                with ui.row().classes("justify-between items-center mb-4"):
                    ui.label("All Time:").classes("text-gray-600")
                    ui.label("0").classes("font-semibold text-primary")

                ui.button("Clear Statistics", on_click=clear_statistics).classes(
                    "w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                )

        # JavaScript for local storage management
        ui.add_body_html("""
        <script>
        // Beer counter local storage functions
        window.beerCounter = {
            // Get current count
            getCount: function() {
                return parseInt(localStorage.getItem('beerCount') || '0');
            },
            
            // Set count
            setCount: function(count) {
                localStorage.setItem('beerCount', count.toString());
            },
            
            // Get today's date key
            getTodayKey: function() {
                return new Date().toISOString().split('T')[0];
            },
            
            // Get week key (Monday-based week)
            getWeekKey: function() {
                const date = new Date();
                const monday = new Date(date);
                monday.setDate(date.getDate() - (date.getDay() || 7) + 1);
                return monday.toISOString().split('T')[0];
            },
            
            // Update daily stats
            updateDailyStats: function(increment) {
                const todayKey = 'beer-today-' + this.getTodayKey();
                const current = parseInt(localStorage.getItem(todayKey) || '0');
                localStorage.setItem(todayKey, (current + increment).toString());
            },
            
            // Update weekly stats  
            updateWeeklyStats: function(increment) {
                const weekKey = 'beer-week-' + this.getWeekKey();
                const current = parseInt(localStorage.getItem(weekKey) || '0');
                localStorage.setItem(weekKey, (current + increment).toString());
            },
            
            // Get daily count
            getTodayCount: function() {
                const todayKey = 'beer-today-' + this.getTodayKey();
                return parseInt(localStorage.getItem(todayKey) || '0');
            },
            
            // Get weekly count
            getWeekCount: function() {
                const weekKey = 'beer-week-' + this.getWeekKey();
                return parseInt(localStorage.getItem(weekKey) || '0');
            },
            
            // Get all-time total
            getAllTimeCount: function() {
                return parseInt(localStorage.getItem('beerAllTime') || '0');
            },
            
            // Update all-time total
            updateAllTimeCount: function(increment) {
                const current = this.getAllTimeCount();
                localStorage.setItem('beerAllTime', (current + increment).toString());
            },
            
            // Clear all statistics
            clearStats: function() {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith('beer-')) {
                        localStorage.removeItem(key);
                    }
                });
                localStorage.removeItem('beerAllTime');
                localStorage.removeItem('beerCount');
            }
        };
        
        // Update UI function
        window.updateBeerCounterUI = function() {
            const count = window.beerCounter.getCount();
            const todayCount = window.beerCounter.getTodayCount();
            const weekCount = window.beerCounter.getWeekCount();
            const allTimeCount = window.beerCounter.getAllTimeCount();
            
            // Find and update elements by their content or classes
            document.querySelectorAll('.counter-display').forEach(el => {
                el.textContent = count;
            });
        };
        
        // Initialize on page load
        window.addEventListener('load', function() {
            window.updateBeerCounterUI();
        });
        </script>
        """)

        # Initialize display with stored values
        ui.timer(
            0.5,
            lambda: ui.run_javascript("""
            const count = window.beerCounter.getCount();
            const todayCount = window.beerCounter.getTodayCount();
            const weekCount = window.beerCounter.getWeekCount();
            const allTimeCount = window.beerCounter.getAllTimeCount();
            
            // Update all UI elements
            document.querySelectorAll('.counter-display').forEach(el => {
                el.textContent = count;
            });
        """),
            once=True,
        )
