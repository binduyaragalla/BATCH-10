
import { useState } from 'react'
import {
  ScanSearch,
  UploadCloud,
  ImagePlus,
  X,
  Sparkles,
  FileImage,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Flame,
  RefreshCw
} from 'lucide-react'
import '../App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function Scanner() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [foodState, setFoodState] = useState('cooked')
  const [quantity, setQuantity] = useState(100)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.')
      return
    }

    if (preview) URL.revokeObjectURL(preview)

    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setSelectedFile(null)
    setPreview('')
    setResult(null)
    setError('')
  }

  const analyzeFood = async () => {
    if (!selectedFile) {
      setError('Please upload a food image first.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('food_state', foodState)
    formData.append('quantity', String(quantity))

    try {
      const token = localStorage.getItem('nutrivision_token')

      const response = await fetch(
        `${API_URL}/predict-and-nutrition`,
        {
          method: 'POST',
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
          body: formData
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Food analysis failed.')
      }

      setResult(data)
    } catch (err) {
      setError(
        err.message.includes('Failed to fetch')
          ? 'Cannot connect to NutriVision backend. Please check whether the FastAPI server is running.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  const prediction = result?.prediction || {}
  const foodName = prediction.predicted_food || 'Unknown food'
  const confidence = Number(prediction.confidence)
  const nutrition = result?.nutrition
  const nutritionAvailable = result?.nutrition_available === true

  const nutritionItems = nutrition && typeof nutrition === 'object'
    ? Object.entries(nutrition).filter(
        ([, value]) =>
          typeof value === 'number' ||
          (typeof value === 'string' && value.trim() !== '')
      )
    : []

  return (
    <div className="scanner-page">

      <div className="scanner-heading">
        <div>
          <div className="eyebrow">
            <span className="status-dot" /> AI FOOD INTELLIGENCE
          </div>
          <h1>AI Food Scanner</h1>
          <p>
            Upload a food image and let NutriVision identify
            what's on your plate.
          </p>
        </div>
        <div className="scanner-heading-icon">
          <ScanSearch size={27} />
        </div>
      </div>

      <div className="scanner-layout">

        <section className="panel upload-panel">
          <div className="panel-heading">
            <div>
              <h3>Upload your food image</h3>
              <p>Choose a clear image for better recognition</p>
            </div>
            <span className="scanner-step">STEP 01</span>
          </div>

          {!preview ? (
            <label className="upload-zone">
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                hidden
              />

              <div className="upload-icon">
                <UploadCloud size={30} />
              </div>

              <h3>Drop your food image here</h3>
              <p>or click to browse from your device</p>

              <span className="browse-button">
                <ImagePlus size={16} /> Choose image
              </span>

              <small>
                Supported formats: JPG, JPEG, PNG, WEBP
              </small>
            </label>
          ) : (
            <div className="preview-container">
              <div className="preview-top">
                <span>
                  <FileImage size={16} /> Selected image
                </span>
                <button onClick={removeImage} aria-label="Remove image">
                  <X size={17} />
                </button>
              </div>

              <img src={preview} alt="Selected food preview" />

              <div className="file-details">
                <strong>{selectedFile?.name}</strong>
                <span>
                  {(selectedFile?.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          )}

          <div className="scanner-options">
            <label>
              Food preparation state
              <select
                value={foodState}
                onChange={(e) => setFoodState(e.target.value)}
              >
                <option value="cooked">Cooked</option>
                <option value="raw">Raw</option>
              </select>
            </label>

            <label>
              Quantity (grams)
              <input
                type="number"
                min="1"
                max="5000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
          </div>

          <button
            className="analyze-button"
            onClick={analyzeFood}
            disabled={!selectedFile || loading || !quantity || Number(quantity) <= 0}
          >
            {loading ? (
              <>
                <LoaderCircle className="spin" size={18} />
                Analyzing food...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze with AI
              </>
            )}
          </button>

          <div className="scanner-note">
            <Sparkles size={17} />
            <p>
              Tip: Use a well-lit image with the food clearly visible
              for AI recognition.
            </p>
          </div>
        </section>

        <section className="panel result-panel">
          <div className="panel-heading">
            <div>
              <h3>Recognition results</h3>
              <p>Your AI analysis will appear here</p>
            </div>
            <span className="scanner-step">STEP 02</span>
          </div>

          {error && (
            <div className="scanner-error">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && (
            <div className="result-empty">
              <div className="result-illustration">
                <ScanSearch size={42} />
                <span><Sparkles size={16} /></span>
              </div>
              <h3>Ready to identify your food?</h3>
              <p>
                Upload an image and click Analyze with AI to
                see the model prediction.
              </p>
              <div className="result-tags">
                <span>AI Recognition</span>
                <span>Food Detection</span>
                <span>Nutrition Analysis</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="result-empty">
              <LoaderCircle className="spin" size={42} />
              <h3>Analyzing your food...</h3>
              <p>NutriVision AI model is processing your image.</p>
            </div>
          )}

          {result && (
            <div className="analysis-result">
              <div className="success-heading">
                <CheckCircle2 size={20} />
                <span>AI analysis completed</span>
              </div>

              <div className="prediction-card">
                <span className="result-label">PREDICTED FOOD</span>
                <h2>{foodName.replaceAll('_', ' ')}</h2>

                {Number.isFinite(confidence) && (
                  <div className="confidence-row">
                    <span>Model confidence</span>
                    <strong>{confidence.toFixed(2)}%</strong>
                  </div>
                )}
              </div>

              <div className="nutrition-result-heading">
                <Flame size={19} />
                <h3>Nutrition information</h3>
              </div>

              {nutritionAvailable && nutritionItems.length > 0 ? (
                <div className="nutrition-values">
                  {nutritionItems.map(([key, value]) => (
                    <div className="nutrition-value" key={key}>
                      <span>{key.replaceAll('_', ' ')}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="nutrition-unavailable">
                  Nutrition data is not available for this
                  predicted food in the current database.
                </div>
              )}

              <p className="nutrition-disclaimer">
                Nutrition values depend on database coverage and
                selected food state and quantity. Verify values
                before using them for dietary decisions.
              </p>

              <button className="rescan-button" onClick={removeImage}>
                <RefreshCw size={16} /> Scan another food
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default Scanner
