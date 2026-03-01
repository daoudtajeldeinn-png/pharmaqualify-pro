import { useState, useMemo } from 'react';
import { Package, Plus, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast, Toaster } from 'sonner';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { MATERIAL_TYPES, PHARMACOPEIA_TESTS } from '@/lib/constants';
import { generateCOA, generateCOAPDF } from '@/lib/coaExport';
import type { RawMaterial, MaterialTest } from '@/types/materials';

const SAMPLE_MATERIALS: RawMaterial[] = [
  {
    id: 'MAT-001',
    name: 'Paracetamol BP',
    type: 'API',
    supplier: 'Sigma Pharma',
    batchNumber: 'LOT-2026-001',
    pharmacopeia: 'BP',
    quantity: 50,
    unit: 'kg',
    receivedDate: '2026-01-15',
    expiryDate: '2028-01-14',
    location: 'مستودع A - رف 1',
    status: 'Quarantine',
    createdAt: new Date('2026-01-15'),
    tests: PHARMACOPEIA_TESTS.API.map(t => ({ ...t, status: 'Pending' as const }))
  },
  {
    id: 'MAT-002',
    name: 'Microcrystalline Cellulose',
    type: 'Excipient',
    supplier: 'FMC Corporation',
    batchNumber: 'LOT-2026-045',
    pharmacopeia: 'USP',
    quantity: 100,
    unit: 'kg',
    receivedDate: '2026-02-01',
    expiryDate: '2027-02-01',
    location: 'مستودع B - رف 3',
    status: 'Approved',
    createdAt: new Date('2026-02-01'),
    tests: PHARMACOPEIA_TESTS.Excipient.map(t => ({ ...t, status: 'Pass' as const, testedBy: 'Ahmed' }))
  }
];

export default function MaterialInventory() {
  const [materials, setMaterials] = useLocalStorage<RawMaterial[]>('pharma-materials', SAMPLE_MATERIALS);
  const [isNewMaterialOpen, setIsNewMaterialOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [materialForm, setMaterialForm] = useState({
    name: '',
    type: 'API' as const,
    supplier: '',
    batchNumber: '',
    pharmacopeia: 'BP' as const,
    quantity: 0,
    unit: 'kg',
    receivedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    location: '',
  });

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const typeMatch = filterType === 'all' || m.type === filterType;
      const statusMatch = filterStatus === 'all' || m.status === filterStatus;
      const searchMatch = searchTerm === '' || 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && statusMatch && searchMatch;
    });
  }, [materials, filterType, filterStatus, searchTerm]);

  const stats = useMemo(() => ({
    total: materials.length,
    approved: materials.filter(m => m.status === 'Approved').length,
    underTest: materials.filter(m => m.status === 'Under_Test' || m.status === 'Quarantine').length,
    rejected: materials.filter(m => m.status === 'Rejected').length,
  }), [materials]);

  const handleCreateMaterial = () => {
    if (!materialForm.name || !materialForm.batchNumber) {
      toast.error('يرجى إدخال اسم المادة ورقم الدفعة');
      return;
    }

    const tests = PHARMACOPEIA_TESTS[materialForm.type].map(test => ({
      ...test,
      result: undefined,
      testedBy: '',
      testedAt: undefined,
      status: 'Pending' as const,
      remarks: '',
    }));

    const newMaterial: RawMaterial = {
      id: `MAT-${Date.now()}`,
      ...materialForm,
      tests,
      status: 'Quarantine',
      createdAt: new Date(),
    };

    setMaterials(prev => [...prev, newMaterial]);
    toast.success(`تم تسجيل المادة: ${materialForm.name} مع ${tests.length} اختبار`);
    
    setIsNewMaterialOpen(false);
    setMaterialForm({
      name: '',
      type: 'API',
      supplier: '',
      batchNumber: '',
      pharmacopeia: 'BP',
      quantity: 0,
      unit: 'kg',
      receivedDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      location: '',
    });
  };

  const handleUpdateTestResult = (materialId: string, testId: string, updates: Partial<MaterialTest>) => {
    setMaterials(prev => prev.map(material => {
      if (material.id !== materialId) return material;

      const updatedTests = material.tests.map(t => 
        t.id === testId ? { ...t, ...updates, testedAt: new Date() } : t
      );

      const allCompleted = updatedTests.every(t => t.status !== 'Pending');
      const hasFailed = updatedTests.some(t => t.status === 'Fail' || t.status === 'OOS');

      let newStatus = material.status;
      if (allCompleted) {
        newStatus = hasFailed ? 'Rejected' : 'Approved';
      }

      return {
        ...material,
        tests: updatedTests,
        status: newStatus,
      };
    }));

    toast.success('تم تحديث نتيجة الاختبار');
  };

  return (
    <div className="space-y-6 p-4">
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة المواد الخام</h1>
          <p className="text-slate-500 text-sm">تسجيل وتحليل المواد حسب BP/USP/EP</p>
        </div>
        <Button onClick={() => setIsNewMaterialOpen(true)} className="bg-indigo-600">
          <Plus className="h-4 w-4 mr-2" /> تسجيل مادة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">إجمالي المواد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">معتمدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600">قيد الاختبار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{stats.underTest}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">مرفوضة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="بحث بالاسم، الدفعة، أو المورد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="نوع المادة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {MATERIAL_TYPES.map(type => (
              <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="Quarantine">حجر</SelectItem>
            <SelectItem value="Under_Test">قيد الاختبار</SelectItem>
            <SelectItem value="Approved">معتمد</SelectItem>
            <SelectItem value="Rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map(material => (
          <Card 
            key={material.id} 
            className={cn(
              "hover:shadow-md transition-all cursor-pointer",
              selectedMaterial?.id === material.id && "ring-2 ring-indigo-500"
            )}
            onClick={() => setSelectedMaterial(material)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Package className="h-4 w-4 text-slate-600" />
                  </div>
                  <CardTitle className="text-base font-bold">{material.name}</CardTitle>
                </div>
                <Badge 
                  variant={material.status === 'Approved' ? 'default' : material.status === 'Rejected' ? 'destructive' : 'secondary'}
                >
                  {material.status === 'Approved' ? 'معتمد' : 
                   material.status === 'Rejected' ? 'مرفوض' : 
                   material.status === 'Quarantine' ? 'حجر' : 'قيد الاختبار'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">النوع:</span>
                  <span>{MATERIAL_TYPES.find(t => t.key === material.type)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الدفعة:</span>
                  <span className="font-mono">{material.batchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المورد:</span>
                  <span>{material.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الكمية:</span>
                  <span>{material.quantity} {material.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الموقع:</span>
                  <span>{material.location || 'غير محدد'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ الانتهاء:</span>
                  <span className={new Date(material.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                    {material.expiryDate}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">الاختبارات:</span>
                    <span className="font-medium">
                      {material.tests.filter(t => t.status === 'Pass').length}/{material.tests.length} مكتملة
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(material.tests.filter(t => t.status === 'Pass').length / material.tests.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>لا توجد مواد مطابقة للبحث</p>
        </div>
      )}

      <Dialog open={isNewMaterialOpen} onOpenChange={setIsNewMaterialOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تسجيل مادة خام جديدة</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المادة *</Label>
              <Input
                id="name"
                value={materialForm.name}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: Paracetamol BP"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">نوع المادة *</Label>
              <Select 
                value={materialForm.type} 
                onValueChange={(v) => setMaterialForm(prev => ({ ...prev, type: v as RawMaterial['type'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map(type => (
                    <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">رقم الدفعة *</Label>
              <Input
                id="batchNumber"
                value={materialForm.batchNumber}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="LOT-2026-XXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">المورد *</Label>
              <Input
                id="supplier"
                value={materialForm.supplier}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="اسم الشركة الموردة"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacopeia">الدستور</Label>
              <Select 
                value={materialForm.pharmacopeia} 
                onValueChange={(v) => setMaterialForm(prev => ({ ...prev, pharmacopeia: v as RawMaterial['pharmacopeia'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BP">British Pharmacopeia (BP)</SelectItem>
                  <SelectItem value="USP">United States Pharmacopeia (USP)</SelectItem>
                  <SelectItem value="EP">European Pharmacopeia (EP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية</Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  value={materialForm.quantity}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="flex-1"
                />
                <Select 
                  value={materialForm.unit} 
                  onValueChange={(v) => setMaterialForm(prev => ({ ...prev, unit: v }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                    <SelectItem value="units">وحدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedDate">تاريخ الاستلام</Label>
              <Input
                id="receivedDate"
                type="date"
                value={materialForm.receivedDate}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, receivedDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">تاريخ الانتهاء *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={materialForm.expiryDate}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">موقع التخزين</Label>
              <Input
                id="location"
                value={materialForm.location}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="مثال: مستودع A - رف 1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMaterialOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleCreateMaterial} className="bg-indigo-600">
              تسجيل المادة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
        {selectedMaterial && (
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl">{selectedMaterial.name}</DialogTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedMaterial.batchNumber} | {MATERIAL_TYPES.find(t => t.key === selectedMaterial.type)?.label}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateCOA(selectedMaterial)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    تصدير COA
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateCOAPDF(selectedMaterial)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Badge 
                    className="text-lg px-3 py-1"
                    variant={selectedMaterial.status === 'Approved' ? 'default' : selectedMaterial.status === 'Rejected' ? 'destructive' : 'secondary'}
                  >
                    {selectedMaterial.status === 'Approved' ? 'معتمد' : 
                     selectedMaterial.status === 'Rejected' ? 'مرفوض' : 
                     selectedMaterial.status === 'Quarantine' ? 'حجر' : 'قيد الاختبار'}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">معلومات عامة</TabsTrigger>
                <TabsTrigger value="tests">الاختبارات ({selectedMaterial.tests.length})</TabsTrigger>
                <TabsTrigger value="history">التاريخ</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-500">معلومات الأساسية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">المورد:</span>
                        <span className="font-medium">{selectedMaterial.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">الدستور:</span>
                        <span className="font-medium">{selectedMaterial.pharmacopeia}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">الكمية المتاحة:</span>
                        <span className="font-medium">{selectedMaterial.quantity} {selectedMaterial.unit}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-500">تواريخ</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">تاريخ الاستلام:</span>
                        <span>{selectedMaterial.receivedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">تاريخ الانتهاء:</span>
                        <span className={new Date(selectedMaterial.expiryDate) < new Date() ? 'text-red-600 font-bold' : ''}>
                          {selectedMaterial.expiryDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">الموقع:</span>
                        <span>{selectedMaterial.location || 'غير محدد'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="tests" className="mt-4">
                <div className="space-y-3">
                  {selectedMaterial.tests.map((test) => (
                    <Card key={test.id} className={cn(
                      "border-l-4",
                      test.status === 'Pass' ? 'border-l-green-500' :
                      test.status === 'Fail' ? 'border-l-red-500' :
                      test.status === 'OOS' ? 'border-l-orange-500' :
                      'border-l-slate-300'
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{test.name}</h4>
                              <Badge variant="outline" className="text-xs">{test.method}</Badge>
                            </div>
                            <p className="text-sm text-slate-500">المواصفة: {test.spec}</p>
                            
                            {test.status !== 'Pending' && (
                              <div className="mt-2 text-sm">
                                <span className="text-slate-500">النتيجة: </span>
                                <span className="font-medium">{test.result}</span>
                                {test.testedBy && (
                                  <span className="text-slate-400 text-xs mr-2">
                                    (بواسطة {test.testedBy} في {test.testedAt?.toLocaleDateString('ar-SA')})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 min-w-[200px]">
                            <Select 
                              value={test.status} 
                              onValueChange={(v) => handleUpdateTestResult(selectedMaterial.id, test.id, { status: v as MaterialTest['status'] })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">قيد الانتظار</SelectItem>
                                <SelectItem value="Pass">مطابق</SelectItem>
                                <SelectItem value="Fail">غير مطابق</SelectItem>
                                <SelectItem value="OOS">OOS (Out of Specification)</SelectItem>
                              </SelectContent>
                            </Select>

                            {test.type === 'quantitative' ? (
                              <Input
                                placeholder="القيمة العددية"
                                type="number"
                                step="0.01"
                                value={test.result || ''}
                                onChange={(e) => handleUpdateTestResult(selectedMaterial.id, test.id, { result: parseFloat(e.target.value) })}
                                disabled={test.status === 'Pending'}
                              />
                            ) : (
                              <Select
                                value={test.result as string || ''}
                                onValueChange={(v) => handleUpdateTestResult(selectedMaterial.id, test.id, { result: v })}
                                disabled={test.status === 'Pending'}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر النتيجة" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Positive">موجب</SelectItem>
                                  <SelectItem value="Negative">سالب</SelectItem>
                                  <SelectItem value="Complies">مطابق</SelectItem>
                                  <SelectItem value="Not Complies">غير مطابق</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-slate-500 w-32">{selectedMaterial.createdAt.toLocaleDateString('ar-SA')}</span>
                        <span>تم استلام المادة ووضعها في الحجر</span>
                      </div>
                      {selectedMaterial.tests.some(t => t.status !== 'Pending') && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-slate-500 w-32">
                            {selectedMaterial.tests.find(t => t.testedAt)?.testedAt?.toLocaleDateString('ar-SA')}
                          </span>
                          <span>بدء إجراء الاختبارات</span>
                        </div>
                      )}
                      {selectedMaterial.status === 'Approved' && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-600 rounded-full" />
                          <span className="text-slate-500 w-32">{new Date().toLocaleDateString('ar-SA')}</span>
                          <span>تم اعتماد المادة للاستخدام</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}