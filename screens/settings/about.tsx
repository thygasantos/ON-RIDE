import { View, Text, Image, Dimensions, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Card, Title, Paragraph } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { FontAwesome } from '@expo/vector-icons';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const YEAR = new Date().getFullYear();

export default function about() {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const theme = {
    colors: {
      primary: '#1E88E5',
      background: '#121212',
      text: '#FFFFFF',
      secondaryText: '#B0BEC5',
    },
    spacing: {
      small: 8,
      medium: 16,
      large: 24,
    },
  };

  return (
    <View 
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.medium,
      }}
      accessible={true}
      accessibilityLabel="About ON Technologies"
    >
      <Animatable.View 
        animation="fadeInUp"
        duration={1000}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card 
          style={{
            width: SCREEN_WIDTH * 0.95,
            backgroundColor: '#1C2526',
            borderRadius: 12,
            padding: theme.spacing.large,
            elevation: 4,
          }}
        >
          <Card.Content style={{ alignItems: 'center' }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              overflow: 'hidden',
              marginBottom: theme.spacing.large,
              backgroundColor: theme.colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {isImageLoading && !imageError && (
                <ActivityIndicator size="large" color={theme.colors.primary} />
              )}
              <Image
                source={{ uri: 'https://on-host-api.vercel.app/static/icon.png' }}
                style={{
                  width: '100%',
                  height: '100%',
                  display: imageError ? 'none' : 'flex',
                }}
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
                onError={() => {
                  setIsImageLoading(false);
                  setImageError(true);
                }}
                accessibilityLabel="ON Technologies logo"
              />
              {imageError && (
                <FontAwesome name="image" size={60} color={theme.colors.secondaryText} />
              )}
            </View>

            <Title 
              style={{
                color: theme.colors.text,
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: theme.spacing.medium,
              }}
            >
              ON Technologies
            </Title>

            <Paragraph 
              style={{
                color: theme.colors.secondaryText,
                fontSize: 16,
                lineHeight: 24,
                textAlign: 'center',
                marginBottom: theme.spacing.large,
              }}
            >
              ON Technologies is a digital micro-startup providing innovative urban private transportation services. 
              Our application connects passengers with nearby drivers, offering a seamless and efficient 
              alternative to traditional mobility services. Built with open-source resources from GitHub, 
              we're committed to revolutionizing urban transportation.
            </Paragraph>

            <View style={{
              alignItems: 'center',
              marginTop: theme.spacing.medium,
            }}>
              <Text style={{
                color: theme.colors.secondaryText,
                fontSize: 14,
                marginBottom: theme.spacing.small,
              }}>
                Version: 1.0.0
              </Text>
              <Text style={{
                color: theme.colors.secondaryText,
                fontSize: 14,
                marginBottom: theme.spacing.small,
              }}>
              </Text>
              <Text style={{
                color: theme.colors.secondaryText,
                fontSize: 14,
              }}>
                © {YEAR} ON Technologies.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </Animatable.View>
    </View>
  );
}
