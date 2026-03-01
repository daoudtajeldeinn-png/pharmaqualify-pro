
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
    Calendar, CheckCircle, Clock, FileText, FlaskConical, TrendingUp, AlertTriangle, Play} from 'lucide-react';
import type { StabilityProtocol, StabilityCondition, StabilityTimePoint, TestResult, ParameterResult } from '@/types';
import { useStore } from '@/hooks/useStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StabilityDetailsProps {
    protocol: StabilityProtocol;
    onBack: () => void;
}

export function StabilityDetails({ protocol, onBack }: StabilityDetailsProps) {
    const { state, dispatch } = useStore();
    const [selectedSample, setSelectedSample] = useState<{ condition: string; timePoint: string } | null>(null);
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);

    // Get product details
    const product = state.products.find(p => p.id === protocol.productId);

    // Helper to generate a unique sample ID for (Condition, TimePoint)
    const getSampleId = (conditionId: string, timePointId: string) => {
        return `${protocol.protocolNumber}-${conditionId}-${timePointId}`;
    };

    // Helper to get status of a sample point
    const getSampleStatus = (conditionId: string, timePointId: string) => {
        const sampleId = getSampleId(conditionId, timePointId);
        const results = state.testResults.filter(r => r.sampleId === sampleId);

        if (results.length === 0) return 'Pending';
        if (results.some(r => r.overallResult === 'OOS')) return 'OOS';

        // Check if all required tests are completed
        const requiredTests = protocol.tests || [];
        // Filter results that match required tests and are completed
        const completedTests = results.filter(r => requiredTests.includes(r.testMethodId) && r.status === 'Completed');

        if (requiredTests.length > 0 && completedTests.length >= requiredTests.length) {
            // Check if any failed
            if (completedTests.some(r => r.overallResult === 'Fail')) return 'Fail';
            return 'Completed';
        }

        if (results.some(r => r.status === 'In_Progress')) return 'In_Progress';

        return 'Scheduled';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'OOS': return 'bg-red-100 text-red-800 border-red-200 font-bold';
            case 'Fail': return 'bg-red-100 text-red-800 border-red-200';
            case 'In_Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Scheduled': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-500 border-slate-200';
        }
    };


    const handleCellClick = (condition: StabilityCondition, timePoint: StabilityTimePoint) => {
        setSelectedSample({ condition: condition.id, timePoint: timePoint.id });
        setIsResultDialogOpen(true);
    };

    // Start a test by creating a TestResult record
    const handleStartTest = (testMethodId: string) => {
        if (!selectedSample) return;
        const method = state.testMethods.find(m => m.id === testMethodId);
        if (!method) return;

        const sampleId = getSampleId(selectedSample.condition, selectedSample.timePoint);

        const newResult: TestResult = {
            id: crypto.randomUUID(),
            productId: protocol.productId,
            testMethodId: method.id,
            batchNumber: protocol.batchNumber,
            sampleId: sampleId,
            analystId: 'CURRENT_USER', // Replace with actual user ID if available
            testDate: new Date(),
            parameters: method.parameters?.map(p => ({
                parameterId: p.id,
                parameterName: p.name,
                value: '',
                unit: p.unit,
                result: 'Pending',
            } as ParameterResult)) || [],
            overallResult: 'Pending' as any, // Only set to Pass/Fail via update
            status: 'In_Progress',
            notes: '',
            attachments: []
        };
        dispatch({ type: 'ADD_TEST_RESULT', payload: newResult });
        toast.success(`Started test: ${method.name}`);
    };

    // Update a specific parameter value locally before saving
    const handleParameterUpdate = (resultId: string, parameterId: string, value: string) => {
        const result = state.testResults.find(r => r.id === resultId);
        if (!result) return;

        const updatedParameters = result.parameters.map(p =>
            p.parameterId === parameterId ? { ...p, value: value } : p
        );

        const updatedResult = { ...result, parameters: updatedParameters };
        dispatch({ type: 'UPDATE_TEST_RESULT', payload: updatedResult });
    };

    // Complete the test
    const handleCompleteTest = (resultId: string) => {
        const result = state.testResults.find(r => r.id === resultId);
        if (!result) return;

        // Simple logic: if all params have values, mark as Completed & Pass
        // Real logic would validate against spec
        const updatedResult: TestResult = {
            ...result,
            status: 'Completed',
            overallResult: 'Pass',
            completionDate: new Date(),
        };
        dispatch({ type: 'UPDATE_TEST_RESULT', payload: updatedResult });
        toast.success('Test completed');
    };


    // Calculate progress
    const totalPoints = (protocol.storageConditions.length || 0) * (protocol.timePoints.length || 0);
    const completedPoints = protocol.storageConditions.reduce((acc, c) => {
        return acc + protocol.timePoints.reduce((acc2, tp) => {
            return acc2 + (getSampleStatus(c.id, tp.id) === 'Completed' ? 1 : 0);
        }, 0);
    }, 0);
    const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    // Derived state for dialog
    const currentSampleId = selectedSample ? getSampleId(selectedSample.condition, selectedSample.timePoint) : '';
    const currentSampleResults = state.testResults.filter(r => r.sampleId === currentSampleId);
    const selectedConditionObj = protocol.storageConditions.find(c => c.id === selectedSample?.condition);
    const selectedTimePointObj = protocol.timePoints.find(tp => tp.id === selectedSample?.timePoint);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs text-slate-500">
                            {protocol.protocolNumber}
                        </Badge>
                        <Badge className={cn('capitalize',
                            protocol.status === 'Active' ? 'bg-green-500' : 'bg-slate-500'
                        )}>
                            {protocol.status.replace('_', ' ')}
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {product?.name || 'Unknown Product'}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                        <span className="flex items-center gap-1">
                            <FlaskConical className="h-4 w-4" />
                            Batch: {protocol.batchNumber}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Started: {format(new Date(protocol.initiationDate), 'dd MMM yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {protocol.studyType.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onBack}>Back to List</Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progress}%</div>
                        <p className="text-xs text-slate-500 mt-1">
                            {completedPoints} of {totalPoints} time points complete
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Next Pull Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {format(new Date(), 'dd MMM')}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Upcoming Schedule
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Deviations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">0</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Recorded for this protocol
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">OOS Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">0</div>
                        <p className="text-xs text-slate-500 mt-1">
                            Requires investigation
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="matrix" className="w-full">
                <TabsList>
                    <TabsTrigger value="matrix">Stability Matrix</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="matrix" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stability Study Matrix</CardTitle>
                            <CardDescription>
                                Schedule of tests across all storage conditions and time points.
                                Click on a status cell to view or manage results.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="w-full whitespace-nowrap rounded-md border max-h-[500px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                            <TableHead className="w-[200px] border-r bg-slate-50">Condition / Zone</TableHead>
                                            {protocol.timePoints.sort((a, b) => a.month - b.month).map(tp => (
                                                <TableHead key={tp.id} className="text-center min-w-[140px] bg-slate-50">
                                                    <div className="flex flex-col items-center py-2">
                                                        <span className="font-bold text-slate-700">{tp.label}</span>
                                                        <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border mt-1">
                                                            {tp.month} Months
                                                        </span>
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {protocol.storageConditions.map(condition => (
                                            <TableRow key={condition.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium border-r bg-slate-50/30 sticky left-0">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-700">{condition.condition}</span>
                                                        <span className="text-[10px] text-slate-500">{condition.zone}</span>
                                                    </div>
                                                </TableCell>
                                                {protocol.timePoints.sort((a, b) => a.month - b.month).map(tp => {
                                                    const status = getSampleStatus(condition.id, tp.id);
                                                    return (
                                                        <TableCell key={tp.id} className="text-center p-3">
                                                            <div
                                                                className={cn(
                                                                    "rounded-lg py-2.5 px-3 text-xs font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm border",
                                                                    getStatusColor(status)
                                                                )}
                                                                onClick={() => handleCellClick(condition, tp)}
                                                            >
                                                                {status.replace('_', ' ')}
                                                            </div>
                                                            {status !== 'Pending' && (
                                                                <div className="text-[9px] text-slate-400 mt-1.5 flex items-center justify-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {format(new Date(tp.scheduledDate), 'dd MMM')}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <CardTitle>Testing Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-6 pl-4">
                                    {protocol.timePoints.sort((a, b) => a.month - b.month).map((tp, idx) => (
                                        <div key={tp.id} className="flex gap-4 relative group">
                                            <div className="flex flex-col items-center z-10">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                                                    new Date() > new Date(tp.scheduledDate) ? "bg-indigo-100 border-indigo-500 text-indigo-700" : "bg-white border-slate-300 text-slate-500"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                                {idx < protocol.timePoints.length - 1 && (
                                                    <div className="w-0.5 h-full bg-slate-200 my-2 group-hover:bg-indigo-200 transition-colors" />
                                                )}
                                            </div>
                                            <div className="pb-8">
                                                <h4 className="font-bold text-sm text-slate-800">{tp.label} ({tp.month} Months)</h4>
                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Scheduled: {format(new Date(tp.scheduledDate), 'PPP')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trend Analysis</CardTitle>
                            <CardDescription>Visualize critical quality attributes over time.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed rounded-lg bg-slate-50/50">
                                <TrendingUp className="h-12 w-12 mb-3 text-slate-300" />
                                <p className="font-medium">No trend data available yet.</p>
                                <p className="text-xs">Complete more time points to generate charts.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Protocol Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 border-2 border-dashed rounded-lg bg-slate-50/50">
                                <FileText className="h-12 w-12 mb-3 text-slate-300" />
                                <p className="font-medium">No documents attached.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manage Sample</DialogTitle>
                        <CardDescription>
                            {selectedConditionObj?.condition} ({selectedConditionObj?.zone}) — {selectedTimePointObj?.label}
                        </CardDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-6">
                        {(protocol.tests?.length || 0) === 0 ? (
                            <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-lg">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                                <p>No tests defined for this protocol.</p>
                                <p className="text-xs">Please edit the protocol to add required tests.</p>
                            </div>
                        ) : (
                            protocol.tests?.map((testId) => {
                                const method = state.testMethods.find(m => m.id === testId);
                                const result = currentSampleResults.find(r => r.testMethodId === testId);

                                return (
                                    <div key={testId} className="border rounded-lg overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{method?.name || 'Unknown Test'}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Method ID: {method?.id.substring(0, 8)}</p>
                                            </div>
                                            {result ? (
                                                <Badge variant={result.status === 'Completed' ? 'default' : 'outline'} className={cn(
                                                    result.status === 'Completed'
                                                        ? (result.overallResult === 'Pass' ? 'bg-green-600' : 'bg-red-600')
                                                        : 'text-blue-600 border-blue-200 bg-blue-50'
                                                )}>
                                                    {result.status === 'Completed' ? result.overallResult : result.status.replace('_', ' ')}
                                                </Badge>
                                            ) : (
                                                <Button size="sm" variant="secondary" onClick={() => handleStartTest(testId)}>
                                                    <Play className="mr-2 h-3 w-3" /> Start
                                                </Button>
                                            )}
                                        </div>

                                        {result && (
                                            <div className="p-4 space-y-4 bg-white">
                                                <div className="space-y-3">
                                                    {result.parameters.map(param => (
                                                        <div key={param.parameterId} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between p-2 rounded hover:bg-slate-50">
                                                            <div className="flex-1">
                                                                <label className="text-xs font-medium text-slate-700 block">{param.parameterName}</label>
                                                                <span className="text-[10px] text-slate-400">Unit: {param.unit || 'N/A'}</span>
                                                            </div>
                                                            <div className="w-full sm:w-32">
                                                                <Input
                                                                    disabled={result.status === 'Completed'}
                                                                    value={String(param.value || '')}
                                                                    onChange={(e) => handleParameterUpdate(result.id, param.parameterId, e.target.value)}
                                                                    className="h-8 text-xs bg-white"
                                                                    placeholder="Value"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {result.status !== 'Completed' && (
                                                    <div className="flex justify-end pt-2 border-t mt-2">
                                                        <Button size="sm" onClick={() => handleCompleteTest(result.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Complete Test
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
