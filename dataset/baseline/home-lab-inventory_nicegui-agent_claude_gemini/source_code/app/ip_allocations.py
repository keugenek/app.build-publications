from nicegui import ui
from app.services import IPAllocationService, HardwareAssetService, SoftwareAssetService
from app.models import IPAllocationCreate, IPAllocationUpdate
import logging

logger = logging.getLogger(__name__)


def create_allocation_form(allocation=None, on_save=None, on_cancel=None):
    """Create form for adding/editing IP allocations"""

    # Get assets for dropdown
    hardware_assets = HardwareAssetService.get_all()
    software_assets = SoftwareAssetService.get_all()

    asset_options = {"none": "No Asset (Reserve IP)"}

    # Add hardware assets
    for asset in hardware_assets:
        asset_options[f"hardware_{asset.id}"] = f"[Hardware] {asset.name} ({asset.type.value})"

    # Add software assets
    for asset in software_assets:
        asset_options[f"software_{asset.id}"] = f"[Software] {asset.name} ({asset.type.value})"

    # Determine current selection
    current_asset = "none"
    if allocation:
        if allocation.hardware_asset_id is not None:
            current_asset = f"hardware_{allocation.hardware_asset_id}"
        elif allocation.software_asset_id is not None:
            current_asset = f"software_{allocation.software_asset_id}"

    # Initialize form data
    ip_input = ui.input(
        label="IP Address",
        value=allocation.ip_address if allocation else "",
        placeholder="e.g., 192.168.1.10, 2001:db8::1",
    ).classes("w-full")

    subnet_input = ui.input(
        label="Subnet Mask",
        value=allocation.subnet_mask if allocation and allocation.subnet_mask else "",
        placeholder="e.g., 255.255.255.0, /24",
    ).classes("w-full")

    gateway_input = ui.input(
        label="Gateway",
        value=allocation.gateway if allocation and allocation.gateway else "",
        placeholder="e.g., 192.168.1.1",
    ).classes("w-full")

    dns_primary_input = ui.input(
        label="Primary DNS",
        value=allocation.dns_primary if allocation and allocation.dns_primary else "",
        placeholder="e.g., 8.8.8.8",
    ).classes("w-full")

    dns_secondary_input = ui.input(
        label="Secondary DNS",
        value=allocation.dns_secondary if allocation and allocation.dns_secondary else "",
        placeholder="e.g., 8.8.4.4",
    ).classes("w-full")

    vlan_input = ui.number(
        label="VLAN ID",
        value=allocation.vlan_id if allocation and allocation.vlan_id else None,
        min=1,
        max=4094,
        placeholder="Optional VLAN ID (1-4094)",
    ).classes("w-full")

    description_input = ui.input(
        label="Description",
        value=allocation.description if allocation and allocation.description else "",
        placeholder="Brief description of this IP allocation",
    ).classes("w-full")

    asset_select = ui.select(options=asset_options, label="Assigned Asset", value=current_asset).classes("w-full")

    is_static_checkbox = ui.checkbox(
        "Static IP Assignment", value=allocation.is_static if allocation else True
    ).classes("w-full")

    is_active_checkbox = ui.checkbox("Active", value=allocation.is_active if allocation else True).classes("w-full")

    notes_input = (
        ui.textarea(
            label="Notes",
            value=allocation.notes if allocation and allocation.notes else "",
            placeholder="Additional notes about this IP allocation",
        )
        .classes("w-full")
        .props("rows=3")
    )

    def save_allocation():
        try:
            if not ip_input.value.strip():
                ui.notify("IP address is required", type="negative")
                return

            # Parse asset selection
            hardware_asset_id = None
            software_asset_id = None

            if asset_select.value and asset_select.value != "none":
                asset_type, asset_id = asset_select.value.split("_", 1)
                if asset_type == "hardware":
                    hardware_asset_id = int(asset_id)
                elif asset_type == "software":
                    software_asset_id = int(asset_id)

            allocation_data = {
                "ip_address": ip_input.value.strip(),
                "subnet_mask": subnet_input.value.strip() or None,
                "gateway": gateway_input.value.strip() or None,
                "dns_primary": dns_primary_input.value.strip() or None,
                "dns_secondary": dns_secondary_input.value.strip() or None,
                "vlan_id": int(vlan_input.value) if vlan_input.value else None,
                "description": description_input.value.strip() or None,
                "hardware_asset_id": hardware_asset_id,
                "software_asset_id": software_asset_id,
                "is_static": is_static_checkbox.value,
                "is_active": is_active_checkbox.value,
                "notes": notes_input.value.strip() or None,
            }

            if allocation is None:
                # Create new allocation
                create_data = IPAllocationCreate(**allocation_data)
                result = IPAllocationService.create(create_data)
                ui.notify(f'IP allocation "{result.ip_address}" created successfully', type="positive")
            else:
                # Update existing allocation
                update_data = IPAllocationUpdate(**allocation_data)
                result = IPAllocationService.update(allocation.id, update_data)
                if result is None:
                    ui.notify("IP allocation not found", type="negative")
                    return
                ui.notify(f'IP allocation "{result.ip_address}" updated successfully', type="positive")

            if on_save:
                on_save()

        except Exception as e:
            logger.error(f"Error saving IP allocation: {e}")
            ui.notify(f"Error saving IP allocation: {str(e)}", type="negative")

    return {
        "form_fields": [
            ip_input,
            subnet_input,
            gateway_input,
            dns_primary_input,
            dns_secondary_input,
            vlan_input,
            description_input,
            asset_select,
            is_static_checkbox,
            is_active_checkbox,
            notes_input,
        ],
        "save_function": save_allocation,
    }


@ui.refreshable
def ip_allocations_table():
    """Refreshable table of IP allocations"""
    try:
        allocations = IPAllocationService.get_all()

        if not allocations:
            with ui.card().classes("p-8 text-center"):
                ui.icon("router", size="3em").classes("text-gray-400")
                ui.label("No IP allocations found").classes("text-xl text-gray-500 mt-4")
                ui.label('Click "Add IP" to create your first IP allocation').classes("text-gray-400")
            return

        # Create table data
        columns = [
            {"name": "ip_address", "label": "IP Address", "field": "ip_address", "align": "left", "sortable": True},
            {"name": "assigned_to", "label": "Assigned To", "field": "assigned_to", "align": "left"},
            {"name": "type", "label": "Type", "field": "type", "align": "center"},
            {"name": "status", "label": "Status", "field": "status", "align": "center"},
            {"name": "vlan", "label": "VLAN", "field": "vlan", "align": "center"},
            {"name": "description", "label": "Description", "field": "description", "align": "left"},
            {"name": "actions", "label": "Actions", "field": "actions", "align": "center"},
        ]

        rows = []
        for allocation in allocations:
            # Determine assignment
            assigned_to = "Unassigned"
            if allocation.hardware_asset:
                assigned_to = f"{allocation.hardware_asset.name} (Hardware)"
            elif allocation.software_asset:
                assigned_to = f"{allocation.software_asset.name} (Software)"

            # Determine type
            ip_type = "Static" if allocation.is_static else "Dynamic"

            # Status
            status = "Active" if allocation.is_active else "Inactive"

            rows.append(
                {
                    "id": allocation.id,
                    "ip_address": allocation.ip_address,
                    "assigned_to": assigned_to,
                    "type": ip_type,
                    "status": status,
                    "vlan": f"VLAN {allocation.vlan_id}" if allocation.vlan_id else "-",
                    "description": allocation.description or "-",
                }
            )

        table = ui.table(columns=columns, rows=rows).classes("w-full")

        # Add status badge styling
        table.add_slot(
            "body-cell-status",
            """
            <q-td key="status" :props="props">
                <q-badge :color="props.value === 'Active' ? 'positive' : 'negative'">
                    {{ props.value }}
                </q-badge>
            </q-td>
        """,
        )

        # Add type badge styling
        table.add_slot(
            "body-cell-type",
            """
            <q-td key="type" :props="props">
                <q-badge :color="props.value === 'Static' ? 'primary' : 'secondary'" outline>
                    {{ props.value }}
                </q-badge>
            </q-td>
        """,
        )

        def handle_action(e):
            action = e.args["action"]
            allocation_id = e.args["allocation_id"]

            match action:
                case "view":
                    view_allocation_details(allocation_id)
                case "edit":
                    edit_allocation(allocation_id)
                case "delete":
                    delete_allocation(allocation_id)

        table.add_slot(
            "body-cell-actions",
            """
            <q-td key="actions" :props="props">
                <q-btn flat round icon="visibility" size="sm" 
                       @click="$parent.$emit('action', {action: 'view', allocation_id: props.row.id})"
                       title="View Details">
                    <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn flat round icon="edit" size="sm" color="primary"
                       @click="$parent.$emit('action', {action: 'edit', allocation_id: props.row.id})"
                       title="Edit Allocation">
                    <q-tooltip>Edit Allocation</q-tooltip>
                </q-btn>
                <q-btn flat round icon="delete" size="sm" color="negative"
                       @click="$parent.$emit('action', {action: 'delete', allocation_id: props.row.id})"
                       title="Delete Allocation">
                    <q-tooltip>Delete Allocation</q-tooltip>
                </q-btn>
            </q-td>
        """,
        )

        table.on("action", handle_action)

    except Exception as e:
        logger.error(f"Error loading IP allocations: {e}")
        ui.notify(f"Error loading IP allocations: {str(e)}", type="negative")


def view_allocation_details(allocation_id: int):
    """Show allocation details in a dialog"""
    allocation = IPAllocationService.get_by_id(allocation_id)
    if allocation is None:
        ui.notify("IP allocation not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        with ui.row().classes("items-center justify-between w-full mb-4"):
            ui.label(f"IP Details: {allocation.ip_address}").classes("text-lg font-semibold")
            ui.button(icon="close", on_click=dialog.close).props("flat round")

        with ui.column().classes("gap-3 w-full"):
            ui.label(f"IP Address: {allocation.ip_address}").classes("text-sm font-medium")
            if allocation.subnet_mask:
                ui.label(f"Subnet Mask: {allocation.subnet_mask}").classes("text-sm")
            if allocation.gateway:
                ui.label(f"Gateway: {allocation.gateway}").classes("text-sm")
            if allocation.dns_primary:
                ui.label(f"Primary DNS: {allocation.dns_primary}").classes("text-sm")
            if allocation.dns_secondary:
                ui.label(f"Secondary DNS: {allocation.dns_secondary}").classes("text-sm")
            if allocation.vlan_id:
                ui.label(f"VLAN ID: {allocation.vlan_id}").classes("text-sm")
            if allocation.description:
                ui.label(f"Description: {allocation.description}").classes("text-sm")

            ui.separator()

            # Assignment info
            if allocation.hardware_asset:
                ui.label(f"Assigned to Hardware: {allocation.hardware_asset.name}").classes("text-sm")
            elif allocation.software_asset:
                ui.label(f"Assigned to Software: {allocation.software_asset.name}").classes("text-sm")
            else:
                ui.label("Status: Unassigned (Reserved)").classes("text-sm")

            ui.label(f"Type: {'Static' if allocation.is_static else 'Dynamic'}").classes("text-sm")
            ui.label(f"Active: {'Yes' if allocation.is_active else 'No'}").classes("text-sm")

            if allocation.notes:
                ui.separator()
                ui.label(f"Notes: {allocation.notes}").classes("text-sm")

        ui.button("Close", on_click=dialog.close).classes("w-full mt-4")

    dialog.open()


def edit_allocation(allocation_id: int):
    """Edit allocation in a dialog"""
    allocation = IPAllocationService.get_by_id(allocation_id)
    if allocation is None:
        ui.notify("IP allocation not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        ui.label(f"Edit IP: {allocation.ip_address}").classes("text-lg font-semibold mb-4")

        def on_save():
            dialog.close()
            ip_allocations_table.refresh()

        form = create_allocation_form(allocation=allocation, on_save=on_save)

        with ui.column().classes("gap-4 w-full"):
            for field in form["form_fields"]:
                pass  # Fields are already created and displayed

        with ui.row().classes("gap-2 justify-end w-full mt-4"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Save Changes", on_click=form["save_function"]).classes("bg-primary text-white")

    dialog.open()


def delete_allocation(allocation_id: int):
    """Delete allocation with confirmation"""
    allocation = IPAllocationService.get_by_id(allocation_id)
    if allocation is None:
        ui.notify("IP allocation not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card():
        ui.label(f"Delete IP: {allocation.ip_address}").classes("text-lg font-semibold mb-4")
        ui.label("Are you sure you want to delete this IP allocation? This action cannot be undone.").classes("mb-4")

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Delete", on_click=lambda: confirm_delete(allocation_id, dialog)).classes("bg-red-500 text-white")

    dialog.open()


def confirm_delete(allocation_id: int, dialog):
    """Confirm and execute allocation deletion"""
    try:
        success = IPAllocationService.delete(allocation_id)
        if success:
            ui.notify("IP allocation deleted successfully", type="positive")
            ip_allocations_table.refresh()
        else:
            ui.notify("Failed to delete IP allocation", type="negative")
        dialog.close()
    except Exception as e:
        logger.error(f"Error deleting IP allocation: {e}")
        ui.notify(f"Error deleting IP allocation: {str(e)}", type="negative")


def show_add_allocation_dialog():
    """Show dialog for adding new IP allocation"""
    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        ui.label("Add New IP Allocation").classes("text-lg font-semibold mb-4")

        def on_save():
            dialog.close()
            ip_allocations_table.refresh()

        form = create_allocation_form(on_save=on_save)

        with ui.column().classes("gap-4 w-full"):
            for field in form["form_fields"]:
                pass  # Fields are already created and displayed

        with ui.row().classes("gap-2 justify-end w-full mt-4"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Add IP", on_click=form["save_function"]).classes("bg-primary text-white")

    dialog.open()


def create():
    """Create IP allocations module"""

    @ui.page("/ip-allocations")
    def ip_allocations_page():
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
                        ui.icon("router", size="2em").classes("text-primary")
                        with ui.column().classes("gap-1"):
                            ui.label("IP Allocations").classes("text-2xl font-bold text-gray-800")
                            ui.label("Manage IP addresses and network configuration").classes("text-gray-600")

                    with ui.row().classes("gap-2"):
                        ui.button("Dashboard", icon="dashboard", on_click=lambda: ui.navigate.to("/dashboard")).props(
                            "outline"
                        )
                        ui.button("Add IP", icon="add", on_click=show_add_allocation_dialog).classes(
                            "bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        )

            # Main content
            with ui.column().classes("flex-1 p-6"):
                ip_allocations_table()
