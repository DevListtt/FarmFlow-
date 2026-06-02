"""
Page de gestion de la comptabilité
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, CalculatorOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;

const ComptabilitePage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEcriture, setEditingEcriture] = useState(null);
  const [filters, setFilters] = useState({ journal: null });
  const queryClient = useQueryClient();

  // Récupérer les écritures comptables
  const { data: ecritures = [], isLoading } = useQuery('ecritures_comptables', async () => {
    const res = await axios.get('/api/comptabilite/ecritures');
    return res.data;
  });

  // Récupérer les journaux
  const { data: journaux = [] } = useQuery('journaux', async () => {
    const res = await axios.get('/api/comptabilite/journaux');
    return res.data;
  });

  // Récupérer les comptes comptables
  const { data: comptes = [] } = useQuery('comptes_comptables', async () => {
    const res = await axios.get('/api/comptabilite/comptes');
    return res.data;
  });

  // Créer ou mettre à jour une écriture
  const mutation = useMutation(
    async (data) => {
      if (editingEcriture) {
        return axios.put(`/api/comptabilite/ecritures/${editingEcriture.id}`, data);
      }
      return axios.post('/api/comptabilite/ecritures', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ecritures_comptables');
        setIsModalVisible(false);
        setEditingEcriture(null);
        form.resetFields();
        message.success(editingEcriture ? 'Écriture mise à jour' : 'Écriture créée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer une écriture
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/comptabilite/ecritures/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ecritures_comptables');
        message.success('Écriture supprimée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (ecriture = null) => {
    setEditingEcriture(ecriture);
    if (ecriture) {
      form.setFieldsValue({
        journal_id: ecriture.journal_id,
        compte_id: ecriture.compte_id,
        date: ecriture.date,
        reference: ecriture.reference,
        libelle: ecriture.libelle,
        debit: ecriture.debit,
        credit: ecriture.credit
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      mutation.mutate(values);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingEcriture(null);
    form.resetFields();
  };

  const typeColors = {
    actif: 'blue',
    passif: 'green',
    charge: 'red',
    produit: 'purple',
    tresorerie: 'gold'
  };

  const filteredEcritures = ecritures.filter(e => {
    if (filters.journal && e.journal_id !== filters.journal) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Comptabilité</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter une Écriture
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Écritures" value={ecritures.length} prefix={<CalculatorOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Total Débit" 
                value={`€${ecritures.reduce((sum, e) => sum + (e.debit || 0), 0).toFixed(2)}`} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Total Crédit" 
                value={`€${ecritures.reduce((sum, e) => sum + (e.credit || 0), 0).toFixed(2)}`} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Comptes" 
                value={comptes.length} 
              />
            </Card>
          </Col>
        </Row>

        {/* Filtres */}
        <Card className="mb-6">
          <div className="flex gap-4">
            <Select 
              placeholder="Filtrer par journal" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, journal: val})}
              allowClear
            >
              {journaux.map(j => (
                <Option key={j.id} value={j.id}>{j.nom} ({j.code})</Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des écritures */}
        <Card>
          <Table 
            dataSource={filteredEcritures} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Date" dataIndex="date" key="date" />
            <Column title="Journal" dataIndex="journal_code" key="journal_code" />
            <Column title="Compte" dataIndex="compte_numero" key="compte_numero" />
            <Column title="Libellé" dataIndex="libelle" key="libelle" />
            <Column title="Référence" dataIndex="reference" key="reference" />
            <Column title="Débit" dataIndex="debit" key="debit" render={(val) => `€${val || 0}`} />
            <Column title="Crédit" dataIndex="credit" key="credit" render={(val) => `€${val || 0}`} />
            <Column 
              title="Type" 
              dataIndex="type_compte" 
              key="type_compte" 
              render={(type) => (
                <Tag color={typeColors[type] || 'default'}>
                  {type}
                </Tag>
              )}
            />
            <Column 
              title="Actions" 
              key="actions" 
              render={(_, record) => (
                <Space>
                  <Button icon={<EyeOutlined />} onClick={() => showModal(record)} size="small" />
                  <Button icon={<EditOutlined />} onClick={() => showModal(record)} size="small" type="link" />
                  <Popconfirm
                    title="Êtes-vous sûr de vouloir supprimer cette écriture ?"
                    onConfirm={() => deleteMutation.mutate(record.id)}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Button icon={<DeleteOutlined />} size="small" danger type="link" />
                  </Popconfirm>
                </Space>
              )}
            />
          </Table>
        </Card>

        {/* Modal */}
        <Modal 
          title={editingEcriture ? 'Modifier Écriture' : 'Ajouter Écriture'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="journal_id" label="Journal" rules={[{ required: true, message: 'Veuillez sélectionner un journal' }]}>
                  <Select placeholder="Sélectionnez un journal">
                    {journaux.map(j => (
                      <Option key={j.id} value={j.id}>{j.nom} ({j.code})</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="compte_id" label="Compte" rules={[{ required: true, message: 'Veuillez sélectionner un compte' }]}>
                  <Select placeholder="Sélectionnez un compte">
                    {comptes.map(c => (
                      <Option key={c.id} value={c.id}>{c.numero} - {c.nom}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="reference" label="Référence">
              <Input placeholder="Référence du document" />
            </Form.Item>
            <Form.Item name="libelle" label="Libellé" rules={[{ required: true, message: 'Veuillez entrer un libellé' }]}>
              <Input placeholder="Libellé de l'écriture" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="debit" label="Débit (€)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="credit" label="Crédit (€)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default ComptabilitePage;
