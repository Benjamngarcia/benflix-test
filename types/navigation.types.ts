/**
 * Navigation Types
 * Type-safe navigation props for all screens
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Show } from './database.types';

// Tab Navigator Params
export type TabParamList = {
  Browse: undefined;
  MyList: undefined;
};

// Root Stack Params
export type RootStackParamList = {
  Tabs: undefined;
  ShowDetail: { show: Show };
  Profile: undefined;
  Login: undefined;
  Register: undefined;
};

// Screen Props Types
export type BrowseScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Browse'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type MyListScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'MyList'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type ShowDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ShowDetail'>;
export type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

// Legacy types for compatibility
export type HomeScreenProps = BrowseScreenProps;
export type FavoritesScreenProps = MyListScreenProps;
