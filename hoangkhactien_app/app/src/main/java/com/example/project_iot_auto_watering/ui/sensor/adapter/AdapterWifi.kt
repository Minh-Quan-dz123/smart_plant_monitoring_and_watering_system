package com.example.project_iot_auto_watering.ui.sensor.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.databinding.ItemWifiBinding

class AdapterWifi(private val listSsid: List<String>,val callBack:(String)->Unit): RecyclerView.Adapter<ViewHolderWifi>() {
    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ): ViewHolderWifi {
        val view= ItemWifiBinding.inflate(LayoutInflater.from(parent.context),parent,false)
        return ViewHolderWifi(view)
    }

    override fun onBindViewHolder(
        holder: ViewHolderWifi,
        position: Int
    ) {
        val item=listSsid[position]
        holder.bind(item)
        holder.binding.tvConnect.setOnClickListener {
            callBack(item)
        }
    }

    override fun getItemCount(): Int {
        return listSsid.size
    }
}

class ViewHolderWifi(val binding: ItemWifiBinding): RecyclerView.ViewHolder(binding.root){
    fun bind(ssid:String){
        binding.tvSsid.text=ssid
    }
}