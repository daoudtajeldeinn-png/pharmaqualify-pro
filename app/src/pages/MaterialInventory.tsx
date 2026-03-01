// 1. Make sure you import the types at the top if they aren't already
// import { MaterialType, Pharmacopeia } from '../types'; 

// 2. Update the useState definition like this:
const [newMaterial, setNewMaterial] = useState<{
  name: string;
  type: 'API' | 'Excipient' | 'Packaging' | 'Consumable'; // Or use MaterialType if defined
  supplier: string;
  batchNumber: string;
  pharmacopeia: 'BP' | 'USP' | 'EP' | 'JP' | 'IP'; // Or use Pharmacopeia if defined
  quantity: number;
  unit: string;
  receivedDate: string;
  expiryDate: string;
  location: string;
}>({
  name: '',
  type: 'API',
  supplier: '',
  batchNumber: '',
  pharmacopeia: 'BP',
  quantity: 0,
  unit: 'kg',
  receivedDate: '',
  expiryDate: '',
  location: ''
});