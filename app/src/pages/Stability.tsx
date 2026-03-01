import { useState } from 'react';
import { useStore } from '@/hooks/useStore';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Eye, Trash2, FileText, X, MoreHorizontal } from 'lucide-react';
import type { StabilityProtocol, StabilityStatus, StabilityCondition, StabilityTimePoint, TimePointStatus } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { StabilityDetails } from '@/components/stability/StabilityDetails';

export function StabilityPage() {
    const { state, dispatch } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProtocol, setSelectedProtocol] = useState<StabilityProtocol | null>(null);
    const [viewingProtocol, setViewingProtocol] = useState<StabilityProtocol | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<StabilityProtocol>>({
        studyType: 'Long_Term',
        storageConditions: [],
        timePoints: [],
        status: 'Draft',
    });

    // Auxiliary State for Conditions and TimePoints
    const [newCondition, setNewCondition] = useState({ condition: '', zone: '' });
    const [newTimePoint, setNewTimePoint] = useState({ month: 0, label: '', windowDays: 7 });
    const [isCustomProduct, setIsCustomProduct] = useState(false);

    const filteredProtocols = (state.stabilityProtocols || []).filter((p) =>
        p.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setSelectedProtocol(null);
        setFormData({
            studyType: 'Long_Term',
            storageConditions: [],
            timePoints: [],
            status: 'Draft',
            protocolNumber: `STAB-${new Date().getFullYear()}-${String((state.stabilityProtocols?.length || 0) + 1).padStart(3, '0')}`,
        });
        setIsFormOpen(true);
    };

    const handleEdit = (protocol: StabilityProtocol) => {
        setSelectedProtocol(protocol);
        setFormData(protocol);
        setIsCustomProduct(!state.products.find(p => p.id === protocol.productId));
        setIsFormOpen(true);
    };

    const handleView = (protocol: StabilityProtocol) => {
        console.log("Viewing protocol:", protocol); // Debug log
        setViewingProtocol(protocol);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this protocol?')) {
            dispatch({ type: 'DELETE_STABILITY_PROTOCOL', payload: id });
        }
    };

    const handleSave = () => {
        if ((!isCustomProduct && !formData.productId) || (isCustomProduct && !formData.productName) || !formData.protocolNumber) {
            alert('Product and Protocol Number are required.');
            return;
        }

        const product = state.products.find(p => p.id === formData.productId);

        const newProtocol: StabilityProtocol = {
            id: selectedProtocol?.id || crypto.randomUUID(),
            protocolNumber: formData.protocolNumber!,
            productId: formData.productId!,
            productName: product?.name || formData.productName || 'Unknown Product',
            batchNumber: formData.batchNumber || product?.batchNumber || 'N/A',
            studyType: formData.studyType || 'Long_Term',
            storageConditions: formData.storageConditions || [],
            timePoints: formData.timePoints || [],
            tests: formData.tests || [],
            packagingType: formData.packagingType || 'Standard',
            sampleQuantity: formData.sampleQuantity || 0,
            manufacturingDate: formData.manufacturingDate || new Date(),
            expiryDate: formData.expiryDate || new Date(),
            initiationDate: formData.initiationDate || new Date(),
            status: formData.status || 'Draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...formData,
        } as StabilityProtocol;

        if (selectedProtocol) {
            dispatch({ type: 'UPDATE_STABILITY_PROTOCOL', payload: newProtocol });
        } else {
            dispatch({ type: 'ADD_STABILITY_PROTOCOL', payload: newProtocol });
        }
        setIsFormOpen(false);
    };

    // Helper to add condition
    const addCondition = () => {
        if (!newCondition.condition || !newCondition.zone) return;
        const condition: StabilityCondition = {
            id: crypto.randomUUID(),
            condition: newCondition.condition,
            zone: newCondition.zone,
        };
        setFormData(prev => ({ ...prev, storageConditions: [...(prev.storageConditions || []), condition] }));
        setNewCondition({ condition: '', zone: '' });
    };

    // Helper to add timepoint
    const addTimePoint = () => {
        if (newTimePoint.month < 0) return;
        const now = new Date();
        const scheduledDate = new Date(now.setMonth(now.getMonth() + newTimePoint.month));

        const timePoint: StabilityTimePoint = {
            id: crypto.randomUUID(),
            label: newTimePoint.label || `${newTimePoint.month} Months`,
            month: newTimePoint.month,
            scheduledDate: scheduledDate,
            windowDays: newTimePoint.windowDays,
            status: 'Scheduled' as TimePointStatus,
        };
        setFormData(prev => ({ ...prev, timePoints: [...(prev.timePoints || []), timePoint] }));
        setNewTimePoint({ month: 0, label: '', windowDays: 7 });
    };

    const removeCondition = (id: string) => {
        setFormData(prev => ({ ...prev, storageConditions: prev.storageConditions?.filter(c => c.id !== id) }));
    };

    const removeTimePoint = (id: string) => {
        setFormData(prev => ({ ...prev, timePoints: prev.timePoints?.filter(tp => tp.id !== id) }));
    };

    const getStatusColor = (status: StabilityStatus) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 border-green-300';
            case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-300';
            case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'Terminated': return 'bg-red-100 text-red-800 border-red-300';
            case 'Pending_Approval': return 'bg-amber-100 text-amber-800 border-amber-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (viewingProtocol) {
        return (
            <StabilityDetails
                protocol={viewingProtocol}
                onBack={() => setViewingProtocol(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Stability Management</h1>
                    <p className="text-slate-500">Manage Stability Protocols, Studies, and Samples (ICH Q1A)</p>
                </div>
                <Button onClick={handleAdd} className="bg-indigo-600">
                    <Plus className="mr-2 h-4 w-4" />
                    New Protocol
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search protocols..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow className="uppercase tracking-tighter text-[11px] font-black">
                            <TableHead>Protocol #</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Conditions</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProtocols.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-8 w-8 opacity-20" />
                                        <p>No stability protocols found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProtocols.map((protocol) => (
                                <TableRow key={protocol.id}>
                                    <TableCell className="font-medium">{protocol.protocolNumber}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{protocol.productName}</p>
                                            <p className="text-xs text-slate-500">ID: {protocol.productId}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{protocol.batchNumber}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{protocol.studyType.replace('_', ' ')}</Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(protocol.initiationDate), 'dd MMM yyyy')}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {protocol.storageConditions.map(c => (
                                                <Badge key={c.id} variant="secondary" className="text-[10px]">
                                                    {c.condition}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn('border', getStatusColor(protocol.status))} variant="secondary">
                                            {protocol.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleView(protocol)}>
                                                <Eye className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(protocol)}>
                                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(protocol.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedProtocol ? 'Edit Protocol' : 'Create Stability Protocol'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">

                        {/* Basic Info Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Product <span className="text-red-500">*</span></Label>
                                    <Button
                                        variant="link"
                                        className="h-auto p-0 text-xs text-indigo-600"
                                        onClick={() => {
                                            setIsCustomProduct(!isCustomProduct);
                                            setFormData({ ...formData, productId: '', productName: '', batchNumber: '' });
                                        }}
                                    >
                                        {isCustomProduct ? "Select from List" : "Enter Custom Name"}
                                    </Button>
                                </div>
                                {isCustomProduct ? (
                                    <Input
                                        placeholder="Enter drug/product name"
                                        value={formData.productName || ''}
                                        onChange={e => setFormData({ ...formData, productName: e.target.value, productId: 'CUSTOM' })}
                                    />
                                ) : (
                                    <Select
                                        value={formData.productId}
                                        onValueChange={(val: string) => {
                                            const prod = state.products.find(p => p.id === val);
                                            setFormData({ ...formData, productId: val, productName: prod?.name, batchNumber: prod?.batchNumber });
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {state.products.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.batchNumber})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Protocol Number <span className="text-red-500">*</span></Label>
                                <Input value={formData.protocolNumber} onChange={e => setFormData({ ...formData, protocolNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Study Type</Label>
                                <Select
                                    value={formData.studyType}
                                    onValueChange={(val: any) => setFormData({ ...formData, studyType: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Long_Term">Long Term</SelectItem>
                                        <SelectItem value="Accelerated">Accelerated</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Photo_Stability">Photo Stability</SelectItem>
                                        <SelectItem value="In_Use">In Use</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Pending_Approval">Pending Approval</SelectItem>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Packaging Type</Label>
                                <Input value={formData.packagingType} onChange={e => setFormData({ ...formData, packagingType: e.target.value })} placeholder="e.g. Alu-Alu Blister" />
                            </div>
                            <div className="space-y-2">
                                <Label>Samples Quantity</Label>
                                <Input type="number" value={formData.sampleQuantity} onChange={e => setFormData({ ...formData, sampleQuantity: Number(e.target.value) })} />
                            </div>
                        </div>

                        {/* Storage Conditions Section */}
                        <div className="space-y-3 border p-4 rounded-md bg-slate-50">
                            <Label className="font-bold text-slate-700">Storage Conditions</Label>
                            <div className="flex gap-2 items-end">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Condition (e.g. 25°C/60%RH)</Label>
                                    <Input
                                        value={newCondition.condition}
                                        onChange={e => setNewCondition({ ...newCondition, condition: e.target.value })}
                                        placeholder="Temperature / Humidity"
                                    />
                                </div>
                                <div className="space-y-1 w-1/3">
                                    <Label className="text-xs">Zone (e.g. Zone IVb)</Label>
                                    <Select
                                        value={newCondition.zone}
                                        onValueChange={(val: string) => setNewCondition({ ...newCondition, zone: val })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select Zone" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Zone I">Zone I</SelectItem>
                                            <SelectItem value="Zone II">Zone II</SelectItem>
                                            <SelectItem value="Zone III">Zone III</SelectItem>
                                            <SelectItem value="Zone IVa">Zone IVa</SelectItem>
                                            <SelectItem value="Zone IVb">Zone IVb</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={addCondition} size="sm" variant="secondary">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.storageConditions?.map(c => (
                                    <Badge key={c.id} variant="outline" className="bg-white flex items-center gap-2 pl-3">
                                        {c.condition} ({c.zone})
                                        <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeCondition(c.id)} />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Time Points Section */}
                        <div className="space-y-3 border p-4 rounded-md bg-slate-50">
                            <Label className="font-bold text-slate-700">Time Points Schedule</Label>
                            <div className="flex gap-2 items-end">
                                <div className="space-y-1 w-24">
                                    <Label className="text-xs">Month</Label>
                                    <Input
                                        type="number"
                                        value={newTimePoint.month}
                                        onChange={e => setNewTimePoint({ ...newTimePoint, month: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs">Label (e.g. 3 Months)</Label>
                                    <Input
                                        value={newTimePoint.label}
                                        onChange={e => setNewTimePoint({ ...newTimePoint, label: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 w-24">
                                    <Label className="text-xs">Window ± days</Label>
                                    <Input
                                        type="number"
                                        value={newTimePoint.windowDays}
                                        onChange={e => setNewTimePoint({ ...newTimePoint, windowDays: Number(e.target.value) })}
                                    />
                                </div>
                                <Button onClick={addTimePoint} size="sm" variant="secondary">Add</Button>
                            </div>
                            <div className="space-y-2 mt-2">
                                {formData.timePoints?.sort((a, b) => a.month - b.month).map(tp => (
                                    <div key={tp.id} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                                        <span className="font-medium">{tp.label} ({tp.month} Mo)</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-slate-500 text-xs">Due: {format(new Date(tp.scheduledDate), 'dd MMM yyyy')}</span>
                                            <Badge variant="outline" className="text-[10px]">{tp.status}</Badge>
                                            <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeTimePoint(tp.id)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Test Methods Section */}
                        <div className="space-y-3 border p-4 rounded-md bg-slate-50">
                            <Label className="font-bold text-slate-700">Required Tests</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {state.testMethods.map((method) => (
                                    <div key={method.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`test-${method.id}`}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={formData.tests?.includes(method.id) || false}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setFormData(prev => {
                                                    const currentTests = prev.tests || [];
                                                    return {
                                                        ...prev,
                                                        tests: checked
                                                            ? [...currentTests, method.id]
                                                            : currentTests.filter(id => id !== method.id)
                                                    };
                                                });
                                            }}
                                        />
                                        <Label htmlFor={`test-${method.id}`} className="text-sm font-normal cursor-pointer">
                                            {method.name}
                                        </Label>
                                    </div>
                                ))}
                                {state.testMethods.length === 0 && (
                                    <p className="text-sm text-slate-500 col-span-full">No test methods available. Please create test methods first.</p>
                                )}
                            </div>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Protocol</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

// Dummy export to match original file structure if needed, but we are replacing the whole function structure.

