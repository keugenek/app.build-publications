from nicegui import ui
from app.services import HardwareAssetService, IPAllocationService
from app.models import HardwareAssetCreate, HardwareAssetUpdate, HardwareType, AssetStatus
import logging

logger = logging.getLogger(__name__)


def create_asset_form(asset=None, on_save=None, on_cancel=None):
    """Create form for adding/editing hardware assets"""

    # Initialize form data
    name_input = ui.input(
        label="Asset Name", value=asset.name if asset else "", placeholder="e.g., Server-01, Core-Switch"
    ).classes("w-full")

    type_select = ui.select(
        options={t.value: t.value.replace("_", " ").title() for t in HardwareType},
        label="Hardware Type",
        value=asset.type.value if asset else HardwareType.SERVER.value,
    ).classes("w-full")

    status_select = ui.select(
        options={s.value: s.value.replace("_", " ").title() for s in AssetStatus},
        label="Status",
        value=asset.status.value if asset else AssetStatus.ACTIVE.value,
    ).classes("w-full")

    manufacturer_input = ui.input(
        label="Manufacturer",
        value=asset.manufacturer if asset and asset.manufacturer else "",
        placeholder="e.g., Dell, HP, Cisco",
    ).classes("w-full")

    model_input = ui.input(
        label="Model",
        value=asset.model if asset and asset.model else "",
        placeholder="e.g., PowerEdge R750, ProCurve 2824",
    ).classes("w-full")

    serial_input = ui.input(
        label="Serial Number",
        value=asset.serial_number if asset and asset.serial_number else "",
        placeholder="Device serial number",
    ).classes("w-full")

    location_input = ui.input(
        label="Location",
        value=asset.location if asset and asset.location else "",
        placeholder="e.g., Rack 1 U10, Office Closet",
    ).classes("w-full")

    notes_input = (
        ui.textarea(
            label="Notes",
            value=asset.notes if asset and asset.notes else "",
            placeholder="Additional notes or configuration details",
        )
        .classes("w-full")
        .props("rows=3")
    )

    def save_asset():
        try:
            if not name_input.value.strip():
                ui.notify("Asset name is required", type="negative")
                return

            asset_data = {
                "name": name_input.value.strip(),
                "type": HardwareType(type_select.value),
                "status": AssetStatus(status_select.value),
                "manufacturer": manufacturer_input.value.strip() or None,
                "model": model_input.value.strip() or None,
                "serial_number": serial_input.value.strip() or None,
                "location": location_input.value.strip() or None,
                "notes": notes_input.value.strip() or None,
            }

            if asset is None:
                # Create new asset
                create_data = HardwareAssetCreate(**asset_data)
                result = HardwareAssetService.create(create_data)
                ui.notify(f'Hardware asset "{result.name}" created successfully', type="positive")
            else:
                # Update existing asset
                update_data = HardwareAssetUpdate(**asset_data)
                result = HardwareAssetService.update(asset.id, update_data)
                if result is None:
                    ui.notify("Asset not found", type="negative")
                    return
                ui.notify(f'Hardware asset "{result.name}" updated successfully', type="positive")

            if on_save:
                on_save()

        except Exception as e:
            logger.error(f"Error saving hardware asset: {e}")
            ui.notify(f"Error saving asset: {str(e)}", type="negative")

    return {
        "form_fields": [
            name_input,
            type_select,
            status_select,
            manufacturer_input,
            model_input,
            serial_input,
            location_input,
            notes_input,
        ],
        "save_function": save_asset,
    }


@ui.refreshable
def hardware_assets_table():
    """Refreshable table of hardware assets"""
    try:
        assets = HardwareAssetService.get_all()

        if not assets:
            with ui.card().classes("p-8 text-center"):
                ui.icon("dns", size="3em").classes("text-gray-400")
                ui.label("No hardware assets found").classes("text-xl text-gray-500 mt-4")
                ui.label('Click "Add Asset" to create your first hardware asset').classes("text-gray-400")
            return

        # Create table data
        columns = [
            {"name": "name", "label": "Name", "field": "name", "align": "left", "sortable": True},
            {"name": "type", "label": "Type", "field": "type", "align": "left", "sortable": True},
            {"name": "status", "label": "Status", "field": "status", "align": "center", "sortable": True},
            {"name": "manufacturer", "label": "Manufacturer", "field": "manufacturer", "align": "left"},
            {"name": "model", "label": "Model", "field": "model", "align": "left"},
            {"name": "location", "label": "Location", "field": "location", "align": "left"},
            {"name": "actions", "label": "Actions", "field": "actions", "align": "center"},
        ]

        rows = []
        for asset in assets:
            rows.append(
                {
                    "id": asset.id,
                    "name": asset.name,
                    "type": asset.type.value.replace("_", " ").title(),
                    "status": asset.status.value.replace("_", " ").title(),
                    "manufacturer": asset.manufacturer or "-",
                    "model": asset.model or "-",
                    "location": asset.location or "-",
                }
            )

        table = ui.table(columns=columns, rows=rows).classes("w-full")
        table.add_slot(
            "body-cell-status",
            """
            <q-td key="status" :props="props">
                <q-badge :color="props.value === 'Active' ? 'positive' : 
                                props.value === 'Maintenance' ? 'warning' : 
                                props.value === 'Inactive' ? 'secondary' : 'negative'">
                    {{ props.value }}
                </q-badge>
            </q-td>
        """,
        )

        def handle_action(e):
            action = e.args["action"]
            asset_id = e.args["asset_id"]

            match action:
                case "view":
                    view_asset_details(asset_id)
                case "edit":
                    edit_asset(asset_id)
                case "delete":
                    delete_asset(asset_id)

        table.add_slot(
            "body-cell-actions",
            """
            <q-td key="actions" :props="props">
                <q-btn flat round icon="visibility" size="sm" 
                       @click="$parent.$emit('action', {action: 'view', asset_id: props.row.id})"
                       title="View Details">
                    <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn flat round icon="edit" size="sm" color="primary"
                       @click="$parent.$emit('action', {action: 'edit', asset_id: props.row.id})"
                       title="Edit Asset">
                    <q-tooltip>Edit Asset</q-tooltip>
                </q-btn>
                <q-btn flat round icon="delete" size="sm" color="negative"
                       @click="$parent.$emit('action', {action: 'delete', asset_id: props.row.id})"
                       title="Delete Asset">
                    <q-tooltip>Delete Asset</q-tooltip>
                </q-btn>
            </q-td>
        """,
        )

        table.on("action", handle_action)

    except Exception as e:
        logger.error(f"Error loading hardware assets: {e}")
        ui.notify(f"Error loading hardware assets: {str(e)}", type="negative")


def view_asset_details(asset_id: int):
    """Show asset details in a dialog"""
    asset = HardwareAssetService.get_by_id(asset_id)
    if asset is None:
        ui.notify("Asset not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        with ui.row().classes("items-center justify-between w-full mb-4"):
            ui.label(f"Asset Details: {asset.name}").classes("text-lg font-semibold")
            ui.button(icon="close", on_click=dialog.close).props("flat round")

        with ui.column().classes("gap-3 w-full"):
            ui.label(f"Type: {asset.type.value.replace('_', ' ').title()}").classes("text-sm")
            ui.label(f"Status: {asset.status.value.replace('_', ' ').title()}").classes("text-sm")
            if asset.manufacturer:
                ui.label(f"Manufacturer: {asset.manufacturer}").classes("text-sm")
            if asset.model:
                ui.label(f"Model: {asset.model}").classes("text-sm")
            if asset.serial_number:
                ui.label(f"Serial Number: {asset.serial_number}").classes("text-sm")
            if asset.location:
                ui.label(f"Location: {asset.location}").classes("text-sm")
            if asset.notes:
                ui.label(f"Notes: {asset.notes}").classes("text-sm")

            # Show IP allocations
            if asset.id is not None:
                ip_allocations = IPAllocationService.get_by_hardware_asset(asset.id)
            else:
                ip_allocations = []
            if ip_allocations:
                ui.separator()
                ui.label("IP Allocations:").classes("text-sm font-medium")
                for ip in ip_allocations:
                    ui.label(f"• {ip.ip_address}").classes("text-sm ml-4")

        ui.button("Close", on_click=dialog.close).classes("w-full mt-4")

    dialog.open()


def edit_asset(asset_id: int):
    """Edit asset in a dialog"""
    asset = HardwareAssetService.get_by_id(asset_id)
    if asset is None:
        ui.notify("Asset not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        ui.label(f"Edit Asset: {asset.name}").classes("text-lg font-semibold mb-4")

        def on_save():
            dialog.close()
            hardware_assets_table.refresh()

        form = create_asset_form(asset=asset, on_save=on_save)

        with ui.column().classes("gap-4 w-full"):
            for field in form["form_fields"]:
                pass  # Fields are already created and displayed

        with ui.row().classes("gap-2 justify-end w-full mt-4"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Save Changes", on_click=form["save_function"]).classes("bg-primary text-white")

    dialog.open()


def delete_asset(asset_id: int):
    """Delete asset with confirmation"""
    asset = HardwareAssetService.get_by_id(asset_id)
    if asset is None:
        ui.notify("Asset not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card():
        ui.label(f"Delete Asset: {asset.name}").classes("text-lg font-semibold mb-4")
        ui.label("Are you sure you want to delete this hardware asset? This action cannot be undone.").classes("mb-4")

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Delete", on_click=lambda: confirm_delete(asset_id, dialog)).classes("bg-red-500 text-white")

    dialog.open()


def confirm_delete(asset_id: int, dialog):
    """Confirm and execute asset deletion"""
    try:
        success = HardwareAssetService.delete(asset_id)
        if success:
            ui.notify("Hardware asset deleted successfully", type="positive")
            hardware_assets_table.refresh()
        else:
            ui.notify("Failed to delete asset", type="negative")
        dialog.close()
    except Exception as e:
        logger.error(f"Error deleting hardware asset: {e}")
        ui.notify(f"Error deleting asset: {str(e)}", type="negative")


def show_add_asset_dialog():
    """Show dialog for adding new asset"""
    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        ui.label("Add New Hardware Asset").classes("text-lg font-semibold mb-4")

        def on_save():
            dialog.close()
            hardware_assets_table.refresh()

        form = create_asset_form(on_save=on_save)

        with ui.column().classes("gap-4 w-full"):
            for field in form["form_fields"]:
                pass  # Fields are already created and displayed

        with ui.row().classes("gap-2 justify-end w-full mt-4"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Add Asset", on_click=form["save_function"]).classes("bg-primary text-white")

    dialog.open()


def create():
    """Create hardware assets module"""

    @ui.page("/hardware")
    def hardware_page():
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        with ui.column().classes("w-full min-h-screen bg-gray-50"):
            # Header
            with ui.card().classes("w-full mb-6 shadow-sm"):
                with ui.row().classes("items-center justify-between p-6"):
                    with ui.row().classes("items-center gap-4"):
                        ui.icon("dns", size="2em").classes("text-primary")
                        with ui.column().classes("gap-1"):
                            ui.label("Hardware Assets").classes("text-2xl font-bold text-gray-800")
                            ui.label("Manage servers, switches, and other hardware infrastructure").classes(
                                "text-gray-600"
                            )

                    with ui.row().classes("gap-2"):
                        ui.button("Dashboard", icon="dashboard", on_click=lambda: ui.navigate.to("/dashboard")).props(
                            "outline"
                        )
                        ui.button("Add Asset", icon="add", on_click=show_add_asset_dialog).classes(
                            "bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        )

            # Main content
            with ui.column().classes("flex-1 p-6"):
                hardware_assets_table()
