import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Package, Trash2, Edit, Eye, Beaker, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { RawMaterial, MaterialType, MaterialStatus, Pharmacopeia } from '@/types/materials';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Extended pharmacopeia type to include more options
const pharmacopeiaOptions: Pharmacopeia[] = ['BP', 'USP', 'EP'];
const materialTypes: MaterialType[] = ['API', 'Excipient', 'Packaging', 'Solvent'];
const materialStatuses: MaterialStatus[] = ['Under_Test', 'Approved', 'Rejected', 'Quarantine'];

// Initial form state
const initialFormState: Omit<RawMaterial, 'id' | 'createdAt' | 'tests' | 'status'> = {
  name: '',
  type: 'API',
  supplier: '',
  batchNumber: '',
  pharmacopeia: 'BP',
  quantity: 0,
  unit: 'kg',
  receivedDate: '',
  expiryDate: '',
  location: '',
};

export default function MaterialInventoryPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  // Load materials from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pharma_materials');
    if (stored) {
      try {
        setMaterials(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse materials:', e);
      }
    }
  }, []);

  // Save materials to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pharma_materials', JSON.stringify(materials));
  }, [materials]);

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || material.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || material.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAdd = () => {
    setSelectedMaterial(null);
    setFormData(initialFormState);
    setIsFormOpen(true);
  };

  const handleEdit = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setFormData({
      name: material.name,
      type: material.type,
      supplier: material.supplier,
      batchNumber: material.batchNumber,
      pharmacopeia: material.pharmacopeia,
      quantity: material.quantity,
      unit: material.unit,
      receivedDate: material.receivedDate,
      expiryDate: material.expiryDate,
      location: material.location || '',
    });
    setIsFormOpen(true);
  };

  const handleView = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (material: RawMaterial) => {
    setSelectedMaterial(material);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedMaterial) {
      setMaterials((prev) => prev.filter((m) => m.id !== selectedMaterial.id));
      toast.success(`Material "${selectedMaterial.name}" deleted successfully.`);
      setIsDeleteDialogOpen(false);
      setSelectedMaterial(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedMaterial) {
      // Update existing material
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === selectedMaterial.id
            ? { ...m, ...formData }
            : m
        )
      );
      toast.success(`Material "${formData.name}" updated successfully.`);
    } else {
      // Add new material
      const newMaterial: RawMaterial = {
        id: crypto.randomUUID(),
        ...formData,
        status: 'Under_Test',
        createdAt: new Date(),
        tests: [],
      };
      setMaterials((prev) => [newMaterial, ...prev]);
      toast.success(`Material "${formData.name}" added successfully.`);
    }
    
    setIsFormOpen(false);
    setFormData(initialFormState);
    setSelectedMaterial(null);
  };

  const getStatusBadge = (status: MaterialStatus) => {
    const statusConfig = {
      Under_Test: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Approved: 'bg-green-100 text-green-800 border-green-300',
      Rejected: 'bg-red-100 text-red-800 border-red-300',
      Quarantine: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    
    const statusIcons = {
      Under_Test: <Beaker className="mr-1 h-3 w-3" />,
      Approved: <CheckCircle className="mr-1 h-3 w-3" />,
      Rejected: <XCircle className="mr-1 h-3 w-3" />,
      Quarantine: <AlertTriangle className="mr-1 h-3 w-3" />,
    };

    return (
      <Badge variant="outline" className={cn(statusConfig[status])}>
        {statusIcons[status]}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raw Material Inventory</h1>
          <p className="text-slate-500">Managing Pharmaceutical Raw Materials & Incoming QC</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600">
          <Plus className="mr-2 h-4 w-4" />
          Register New Material
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, batch or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Material Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {materialTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {materialStatuses.map((status) => (
              <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-bold">Material Name</TableHead>
              <TableHead className="font-bold">Type</TableHead>
              <TableHead className="font-bold">Batch Number</TableHead>
              <TableHead className="font-bold">Supplier</TableHead>
              <TableHead className="font-bold">Quantity</TableHead>
              <TableHead className="font-bold">Expiry Date</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400 italic">
                  No materials found. Click "Register New Material" to add one.
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{material.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{material.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-slate-100 px-2 py-1 text-sm">
                      {material.batchNumber}
                    </code>
                  </TableCell>
                  <TableCell>{material.supplier}</TableCell>
                  <TableCell>
                    {material.quantity} {material.unit}
                  </TableCell>
                  <TableCell>
                    {material.expiryDate
                      ? new Date(material.expiryDate).toLocaleDateString('en-GB')
                      : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(material.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View Details"
                        className="h-8 w-8"
                        onClick={() => handleView(material)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        className="h-8 w-8"
                        onClick={() => handleEdit(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(material)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">
              {selectedMaterial ? 'Edit Material Record' : 'Register New Raw Material'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Material Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Paracetamol API"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Material Type *</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: MaterialType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier *</label>
                <Input
                  required
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="e.g., Sigma-Aldrich"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Number *</label>
                <Input
                  required
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="e.g., BATCH-2024-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pharmacopeia *</label>
                <Select
                  value={formData.pharmacopeia}
                  onValueChange={(value: Pharmacopeia) => setFormData({ ...formData, pharmacopeia: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pharmacopeiaOptions.map((ph) => (
                      <SelectItem key={ph} value={ph}>{ph}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Storage Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Warehouse A, Shelf 12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity *</label>
                <Input
                  required
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit *</label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Received Date *</label>
                <Input
                  required
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date *</label>
                <Input
                  required
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600">
                {selectedMaterial ? 'Update Material' : 'Register Material'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase">
              Material Specification Dossier
            </DialogTitle>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedMaterial.name}</h3>
                  <p className="text-slate-500">{selectedMaterial.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Batch Number:</span>
                  <p className="font-medium">
                    <code className="rounded bg-slate-100 px-2 py-1 text-sm">
                      {selectedMaterial.batchNumber}
                    </code>
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Supplier:</span>
                  <p className="font-medium">{selectedMaterial.supplier}</p>
                </div>
                <div>
                  <span className="text-slate-500">Pharmacopeial Standard:</span>
                  <p className="font-medium">{selectedMaterial.pharmacopeia}</p>
                </div>
                <div>
                  <span className="text-slate-500">Storage Location:</span>
                  <p className="font-medium">{selectedMaterial.location || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Quantity:</span>
                  <p className="font-medium">
                    {selectedMaterial.quantity} {selectedMaterial.unit}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Received Date:</span>
                  <p className="font-medium">
                    {selectedMaterial.receivedDate
                      ? new Date(selectedMaterial.receivedDate).toLocaleDateString('en-GB')
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Expiry Date:</span>
                  <p className="font-medium">
                    {selectedMaterial.expiryDate
                      ? new Date(selectedMaterial.expiryDate).toLocaleDateString('en-GB')
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Current Status:</span>
                  <p className="font-medium">{getStatusBadge(selectedMaterial.status)}</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  className="bg-indigo-600"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEdit(selectedMaterial);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Material
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Confirm Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely certain you want to delete material "{selectedMaterial?.name}"?
              <br />
              This action will permanently remove the material record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
