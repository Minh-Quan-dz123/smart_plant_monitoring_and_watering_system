package com.example.project_iot_auto_watering.ui.home

import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.example.project_iot_auto_watering.ui.more.FragmentMore
import com.example.project_iot_auto_watering.ui.sensor.FragmentSensor

class HomePagerAdapter(fragment: Fragment) : FragmentStateAdapter(fragment) {
    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> FragmentHome()
            1 -> FragmentSensor()
            2 -> FragmentMore()
            else -> FragmentHome()
        }
    }

    override fun getItemCount(): Int {
        return 3
    }

}