"""
Page d'Intelligence Artificielle
"""
import { useState } from 'react';
import { useMutation } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Upload, message, Row, Col, Spin, Tabs, Space, Typography, Divider } from 'antd';
import { UploadOutlined, RobotOutlined, EyeOutlined, FileTextOutlined, CameraOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const IAPage = () => {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);

  // Chatbot mutation
  const chatMutation = useMutation(
    async (message) => {
      const res = await axios.post('/api/ia/chat', { message });
      return res.data;
    },
    {
      onSuccess: (data) => {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
        setIsLoading(false);
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la requête');
        setIsLoading(false);
      }
    }
  );

  // OCR mutation
  const ocrMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post('/api/ia/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    {
      onSuccess: (data) => {
        setOcrResult(data.text);
        message.success('OCR terminé avec succès');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de l\'OCR');
      }
    }
  );

  // Prediction mutation
  const predictionMutation = useMutation(
    async (data) => {
      const res = await axios.post('/api/ia/predict', data);
      return res.data;
    },
    {
      onSuccess: (data) => {
        setPredictionResult(data);
        message.success('Prédiction terminée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la prédiction');
      }
    }
  );

  const handleChatSubmit = () => {
    if (!chatMessage.trim()) return;
    setIsLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', content: chatMessage }]);
    chatMutation.mutate(chatMessage);
    setChatMessage('');
  };

  const handleOcrUpload = (file) => {
    ocrMutation.mutate(file);
    return false;
  };

  const handlePrediction = () => {
    predictionMutation.mutate({
      type: 'rendement',
      data: { surface: 10, type_sol: 'argileux', culture: 'ble' }
    });
  };

  const uploadProps = {
    name: 'image',
    beforeUpload: (file) => {
      handleOcrUpload(file);
      return false;
    },
    showUploadList: false
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Intelligence Artificielle</h1>
        </div>

        <Tabs defaultActiveKey="1" type="card">
          {/* Chatbot */}
          <TabPane tab={<span><RobotOutlined /> Chatbot Agricole</span>} key="1">
            <Card>
              <Title level={3}>Assistant Agricole</Title>
              <Paragraph>
                Posez vos questions sur l'agriculture, la gestion de votre exploitation, 
                les bonnes pratiques, les réglementations, etc.
              </Paragraph>
              
              <div className="mb-4">
                <TextArea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Exemple: Quelle est la meilleure période pour semer le blé ?"
                  rows={4}
                  onPressEnter={(e) => {
                    if (e.shiftKey) return;
                    e.preventDefault();
                    handleChatSubmit();
                  }}
                />
                <Button 
                  type="primary" 
                  icon={<MessageOutlined />} 
                  onClick={handleChatSubmit}
                  loading={isLoading}
                  className="mt-2"
                >
                  Envoyer
                </Button>
              </div>

              <Divider />
              
              <div className="chat-history max-h-96 overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <Paragraph type="secondary">
                    Commencez une conversation avec l'assistant agricole...
                  </Paragraph>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                    >
                      <div className={`inline-block p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                        <strong>{msg.role === 'user' ? 'Vous' : 'Assistant'}:</strong>
                        <div className="mt-1">{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="text-left">
                    <Spin tip="L'assistant réfléchit..." />
                  </div>
                )}
              </div>
            </Card>
          </TabPane>

          {/* OCR */}
          <TabPane tab={<span><FileTextOutlined /> OCR</span>} key="2">
            <Card>
              <Title level={3}>Reconnaissance de Texte (OCR)</Title>
              <Paragraph>
                Extrayez du texte à partir d'images (factures, documents, étiquettes, etc.)
              </Paragraph>
              
              <Upload {...uploadProps}>
                <Button type="primary" icon={<UploadOutlined />}>
                  Sélectionner une Image
                </Button>
              </Upload>
              
              <Divider />
              
              {ocrResult ? (
                <div>
                  <Title level={4}>Résultat OCR:</Title>
                  <div className="bg-gray-100 p-4 rounded">
                    <pre className="whitespace-pre-wrap">{ocrResult}</pre>
                  </div>
                </div>
              ) : (
                <Paragraph type="secondary">
                  Aucune image analysée pour l'instant.
                </Paragraph>
              )}
            </Card>
          </TabPane>

          {/* Prédictions */}
          <TabPane tab={<span><EyeOutlined /> Prédictions</span>} key="3">
            <Card>
              <Title level={3}>Analyse Prédictive</Title>
              <Paragraph>
                Prédisez les rendements, les besoins en eau, les dates optimales de récolte, etc.
              </Paragraph>
              
              <Row gutter={16} className="mb-4">
                <Col span={12}>
                  <Card>
                    <Title level={4}>Prédiction de Rendement</Title>
                    <Paragraph type="secondary">
                      Estimez le rendement de vos cultures en fonction des conditions.
                    </Paragraph>
                    <Button type="primary" onClick={handlePrediction}>
                      Lancer la Prédiction
                    </Button>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Title level={4}>Recommandations</Title>
                    <Paragraph type="secondary">
                      Obtenez des recommandations personnalisées pour votre exploitation.
                    </Paragraph>
                    <Button type="primary">
                      Obtenir des Recommandations
                    </Button>
                  </Card>
                </Col>
              </Row>

              {predictionResult && (
                <Card>
                  <Title level={4}>Résultat de la Prédiction:</Title>
                  <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(predictionResult, null, 2)}
                  </pre>
                </Card>
              )}
            </Card>
          </TabPane>

          {/* Vision par Ordinateur */}
          <TabPane tab={<span><CameraOutlined /> Vision par Ordinateur</span>} key="4">
            <Card>
              <Title level={3}>Analyse d'Images Agricoles</Title>
              <Paragraph>
                Détectez les maladies, les adventices, analysez la santé des cultures, etc.
              </Paragraph>
              
              <Upload
                name="image"
                beforeUpload={() => false}
                showUploadList={false}
              >
                <Button type="primary" icon={<UploadOutlined />}>
                  Sélectionner une Image à Analyser
                </Button>
              </Upload>
              
              <Divider />
              
              <Paragraph type="secondary">
                Fonctionnalité d'analyse d'images disponible (nécessite OpenCV et modèles entraînés).
              </Paragraph>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </Layout>
  );
};

export default IAPage;
