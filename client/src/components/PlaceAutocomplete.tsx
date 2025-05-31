import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, X } from "lucide-react";

interface PlaceResult {
  name: string;
  address: string;
  placeId: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface PlaceAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string, placeData?: PlaceResult) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function PlaceAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // Google Places Autocomplete Service
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    // Google Maps APIが読み込まれているかチェック
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();

      // PlacesServiceの初期化には地図要素が必要
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // 入力が空の場合は候補を非表示
    if (!inputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 前回のタイマーをクリア
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    // 少し遅延させてAPI呼び出しを制限
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
  };

  const fetchSuggestions = async (input: string) => {
    if (!autocompleteService.current || input.length < 2) return;

    setIsLoading(true);

    try {
      const request = {
        input,
        language: 'ja',
        componentRestrictions: { country: 'jp' }, // 日本に限定
        types: ['establishment', 'geocode'] // 施設と地理的場所
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);

          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const results: PlaceResult[] = predictions.slice(0, 5).map(prediction => {
              console.log('Prediction data:', prediction);
              // 施設名と住所を適切に取得
              const name = prediction.structured_formatting.main_text;
              const address = prediction.structured_formatting.secondary_text || prediction.description;
              return {
                name,
                address,
                placeId: prediction.place_id
              };
            });

            setSuggestions(results);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setIsLoading(false);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion: PlaceResult) => {
    console.log('Suggestion clicked:', suggestion);

    // 即座に「施設名 住所」形式で表示を更新
    const displayValue = `${suggestion.name} ${suggestion.address}`;
    console.log('Setting display value:', displayValue);
    onChange(displayValue, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);

    // バックグラウンドで詳細情報を取得（必要に応じて位置情報を更新）
    if (placesService.current) {
      try {
        const request = {
          placeId: suggestion.placeId,
          fields: ['name', 'formatted_address', 'geometry']
        };

        // 新しいAPIの使用方法に変更
        const place = await new Promise<google.maps.places.Place | null>((resolve, reject) => {
          placesService.current?.getDetails(request, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              resolve(place);
            } else {
              resolve(null);
            }
          });
        });

        if (place) {
          const enhancedPlaceData: PlaceResult = {
            name: place.name || suggestion.name,
            address: place.formatted_address || suggestion.address,
            placeId: suggestion.placeId,
            location: place.geometry?.location ? {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            } : undefined
          };

          // 詳細情報が取得できた場合は、より正確な情報で再更新
          const enhancedDisplayValue = `${enhancedPlaceData.name} ${enhancedPlaceData.address}`;
          console.log('Enhanced place data:', enhancedPlaceData);
          onChange(enhancedDisplayValue, enhancedPlaceData);
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    }
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputBlur = () => {
    // 少し遅延させて候補リストを非表示（クリック処理のため）
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && value.trim()) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative flex-1">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`${label ? 'mt-1' : ''} ${error ? 'border-red-500' : ''} ${value.trim() ? 'pr-10' : ''}`}
        />
        {/* クリアボタン */}
        {value.trim() && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
            onClick={handleClear}
            tabIndex={-1}
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}

      {/* 候補リスト */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg border bg-white">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.placeId}
                className="px-3 py-3 sm:px-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors touch-manipulation"
                onMouseDown={(e) => {
                  // preventDefault で onBlur を防ぐ
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }
                }}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-text-primary line-clamp-1">
                      {suggestion.name}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {suggestion.address}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ローディング表示 */}
      {isLoading && showSuggestions && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4 animate-spin" />
              候補を検索中...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}