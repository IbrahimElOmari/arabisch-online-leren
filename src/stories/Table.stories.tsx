import type { Meta, StoryObj } from '@storybook/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';

const meta: Meta = {
  title: 'UI/Table',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// Sample data
const invoices = [
  { invoice: 'INV001', status: 'Betaald', method: 'Creditcard', amount: '€250,00' },
  { invoice: 'INV002', status: 'In behandeling', method: 'PayPal', amount: '€150,00' },
  { invoice: 'INV003', status: 'Niet betaald', method: 'iDEAL', amount: '€350,00' },
  { invoice: 'INV004', status: 'Betaald', method: 'Creditcard', amount: '€450,00' },
  { invoice: 'INV005', status: 'Betaald', method: 'iDEAL', amount: '€550,00' },
];

const students = [
  { id: 1, name: 'Ahmed Al-Rashid', level: 'Gevorderd', progress: 85, status: 'Actief' },
  { id: 2, name: 'Fatima Hassan', level: 'Beginner', progress: 45, status: 'Actief' },
  { id: 3, name: 'Mohammed Ali', level: 'Intermediair', progress: 67, status: 'Inactief' },
  { id: 4, name: 'Sara Ibrahim', level: 'Gevorderd', progress: 92, status: 'Actief' },
  { id: 5, name: 'Omar Khaled', level: 'Beginner', progress: 23, status: 'Actief' },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Een overzicht van recente facturen.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Factuur</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Methode</TableHead>
          <TableHead className="text-end">Bedrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-end">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Totaal</TableCell>
          <TableCell className="text-end">€1.750,00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Table>
      <TableCaption>Studentenoverzicht met voortgang.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Niveau</TableHead>
          <TableHead>Voortgang</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>
              <Badge variant={
                student.level === 'Gevorderd' ? 'default' :
                student.level === 'Intermediair' ? 'secondary' : 'outline'
              }>
                {student.level}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 rounded-full bg-muted">
                  <div 
                    className="h-2 rounded-full bg-primary" 
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{student.progress}%</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={student.status === 'Actief' ? 'default' : 'secondary'}>
                {student.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithCheckboxes: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox aria-label="Selecteer alles" />
          </TableHead>
          <TableHead>Factuur</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Methode</TableHead>
          <TableHead className="text-end">Bedrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell>
              <Checkbox aria-label={`Selecteer ${invoice.invoice}`} />
            </TableCell>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-end">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Naam</TableHead>
          <TableHead>Niveau</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px]">Acties</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.level}</TableCell>
            <TableCell>
              <Badge variant={student.status === 'Actief' ? 'default' : 'secondary'}>
                {student.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Acties voor {student.name}</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Sortable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" className="h-8 px-2">
              Naam
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" className="h-8 px-2">
              Niveau
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" className="h-8 px-2">
              Voortgang
              <ArrowUpDown className="ms-2 h-4 w-4" />
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>{student.level}</TableCell>
            <TableCell>{student.progress}%</TableCell>
            <TableCell>
              <Badge variant={student.status === 'Actief' ? 'default' : 'secondary'}>
                {student.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Striped: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Factuur</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Methode</TableHead>
          <TableHead className="text-end">Bedrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice, index) => (
          <TableRow 
            key={invoice.invoice}
            className={index % 2 === 0 ? 'bg-muted/50' : ''}
          >
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-end">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Compact: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="py-2">Factuur</TableHead>
          <TableHead className="py-2">Status</TableHead>
          <TableHead className="py-2">Bedrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="py-2">{invoice.invoice}</TableCell>
            <TableCell className="py-2">{invoice.status}</TableCell>
            <TableCell className="py-2">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// Arabic data for RTL
const arabicStudents = [
  { id: 1, name: 'أحمد الراشد', level: 'متقدم', progress: 85, status: 'نشط' },
  { id: 2, name: 'فاطمة حسن', level: 'مبتدئ', progress: 45, status: 'نشط' },
  { id: 3, name: 'محمد علي', level: 'متوسط', progress: 67, status: 'غير نشط' },
];

export const RTL: Story = {
  render: () => (
    <div dir="rtl" className="font-arabic">
      <Table>
        <TableCaption>نظرة عامة على الطلاب.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>المستوى</TableHead>
            <TableHead>التقدم</TableHead>
            <TableHead>الحالة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {arabicStudents.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell>{student.level}</TableCell>
              <TableCell>{student.progress}%</TableCell>
              <TableCell>
                <Badge variant={student.status === 'نشط' ? 'default' : 'secondary'}>
                  {student.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Table in Right-to-Left (Arabic) context with RTL support',
      },
    },
  },
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Factuur</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Bedrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
            Geen gegevens beschikbaar.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const AccessibilityTest: Story = {
  render: () => (
    <Table>
      <TableCaption>Factuuroverzicht voor screenreaders.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Factuur</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Bedrag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.slice(0, 3).map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell>{invoice.invoice}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'table-duplicate-name', enabled: true },
        ],
      },
    },
  },
};
